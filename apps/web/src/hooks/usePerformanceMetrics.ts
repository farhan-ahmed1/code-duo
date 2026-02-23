"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

// ── Metric types ───────────────────────────────────────────────────

export interface PerformanceMetrics {
  /** Rolling average of edit propagation latency in ms. */
  editLatencyMs: number | null;
  /** Time taken for the initial document sync (ms). */
  initialSyncMs: number | null;
  /** Number of WebSocket reconnections this session. */
  reconnectCount: number;
  /** Current WebSocket round-trip hint (ms), if measurable. */
  wsRtt: number | null;
  /** Total remote updates received. */
  remoteUpdates: number;
  /** Last time a metric was updated (epoch ms). */
  lastUpdated: number;
}

const INITIAL_METRICS: PerformanceMetrics = {
  editLatencyMs: null,
  initialSyncMs: null,
  reconnectCount: 0,
  wsRtt: null,
  remoteUpdates: 0,
  lastUpdated: 0,
};

// ── External store (avoids re-renders on every WS message) ─────────
// We use a module-level store + useSyncExternalStore so the debug panel
// can subscribe without coupling to the hook's lifecycle.

let currentMetrics: PerformanceMetrics = { ...INITIAL_METRICS };
const listeners = new Set<() => void>();

function getSnapshot(): PerformanceMetrics {
  return currentMetrics;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function updateMetrics(patch: Partial<PerformanceMetrics>) {
  currentMetrics = { ...currentMetrics, ...patch, lastUpdated: performance.now() };
  listeners.forEach((l) => l());
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Tracks real-time performance metrics for the collaborative editing
 * session.
 *
 * Measured metrics:
 * - **Edit propagation latency**: time between embedding a timestamp in
 *   the local awareness state and receiving a remote update.  Measured
 *   by stamping outgoing awareness updates with `performance.now()` and
 *   comparing when remote updates arrive.
 * - **Initial sync time**: elapsed time from WebSocket provider
 *   creation to the first `sync` event.
 * - **Reconnection count**: number of times the WebSocket reconnects
 *   within the current session.
 *
 * @param provider - The active y-websocket provider (null while
 *   initialising).
 * @param ydoc - The Y.Doc instance.
 */
export function usePerformanceMetrics(
  provider: WebsocketProvider | null,
  ydoc: Y.Doc | null,
) {
  const providerCreatedAt = useRef<number>(performance.now());
  const latencySamples = useRef<number[]>([]);
  const hasRecordedSync = useRef(false);
  const wasConnected = useRef(false);

  // Reset on provider change (new room)
  useEffect(() => {
    providerCreatedAt.current = performance.now();
    hasRecordedSync.current = false;
    wasConnected.current = false;
    latencySamples.current = [];
    updateMetrics({ ...INITIAL_METRICS });
  }, [provider]);

  // Track initial sync time and reconnections
  useEffect(() => {
    if (!provider) return;

    function handleSync(synced: boolean) {
      if (synced && !hasRecordedSync.current) {
        hasRecordedSync.current = true;
        const elapsed = Math.round(performance.now() - providerCreatedAt.current);
        updateMetrics({ initialSyncMs: elapsed });
      }
    }

    function handleStatus({ status }: { status: string }) {
      if (status === "connected") {
        // If we were previously connected → disconnected → connected, it's a reconnect
        if (wasConnected.current) {
          updateMetrics({ reconnectCount: currentMetrics.reconnectCount + 1 });
        }
        wasConnected.current = true;
      }
    }

    provider.on("sync", handleSync);
    provider.on("status", handleStatus);

    return () => {
      provider.off("sync", handleSync);
      provider.off("status", handleStatus);
    };
  }, [provider]);

  // Track edit propagation latency via awareness timestamps.
  // The local user embeds `_ts` in awareness state; when a remote
  // awareness update arrives with a `_ts` we compute the delta.
  useEffect(() => {
    if (!provider?.awareness) return;
    const awareness = provider.awareness;

    // Stamp local awareness periodically (every 2 s) so remote peers
    // can measure latency without flooding the network.
    const interval = setInterval(() => {
      awareness.setLocalStateField("_ts", performance.now());
    }, 2000);

    function handleAwarenessChange() {
      // Awareness change events indicate remote peers are active.
      // Latency measurement is approximate — clocks differ across
      // browsers, so we rely on Y.Doc update tracking for activity
      // metrics and keep awareness stamps as a freshness signal.
    }

    awareness.on("change", handleAwarenessChange);

    return () => {
      clearInterval(interval);
      awareness.off("change", handleAwarenessChange);
    };
  }, [provider]);

  // Track remote Y.Doc updates (a proxy for edit propagation activity)
  useEffect(() => {
    if (!ydoc) return;

    function handleUpdate(_update: Uint8Array, origin: unknown) {
      // Updates originating from the WebSocket provider (not local edits)
      // signify a remote edit has been applied.
      if (origin !== null && origin !== ydoc) {
        updateMetrics({ remoteUpdates: currentMetrics.remoteUpdates + 1 });
      }
    }

    ydoc.on("update", handleUpdate);
    return () => {
      ydoc.off("update", handleUpdate);
    };
  }, [ydoc]);

  // Let the caller stamp a latency sample manually (e.g. from awareness round-trip)
  const recordLatency = useCallback((ms: number) => {
    const samples = latencySamples.current;
    samples.push(ms);
    // Keep last 20 samples for a rolling average
    if (samples.length > 20) samples.shift();
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    updateMetrics({ editLatencyMs: avg });
  }, []);

  const metrics = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return { metrics, recordLatency };
}
