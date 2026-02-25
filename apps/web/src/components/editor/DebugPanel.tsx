"use client";

import { useEffect, useState } from "react";
import type { PerformanceMetrics } from "@/hooks/usePerformanceMetrics";
import type { ConnectionStatus, SyncStatus } from "@code-duo/shared";

interface DebugPanelProps {
  metrics: PerformanceMetrics;
  connectionStatus: ConnectionStatus;
  syncStatus: SyncStatus;
  visible: boolean;
  onClose: () => void;
}

/**
 * A subtle floating debug panel that displays real-time performance
 * metrics for the current collaborative editing session.
 *
 * Toggled via `Ctrl/Cmd + Shift + D` — see `RoomClient.tsx`.
 */
export default function DebugPanel({
  metrics,
  connectionStatus,
  syncStatus,
  visible,
  onClose,
}: DebugPanelProps) {
  const [now, setNow] = useState(performance.now());

  // Tick every second so "uptime" and elapsed values refresh
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const statusColor: Record<ConnectionStatus, string> = {
    connected: "text-green-400",
    connecting: "text-yellow-400",
    disconnected: "text-red-400",
  };

  return (
    <div
      role="complementary"
      aria-label="Debug metrics"
      className="absolute bottom-4 left-4 z-50 w-72 rounded-lg border border-gray-700 bg-gray-900/95 p-4 text-xs text-gray-300 shadow-2xl backdrop-blur"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-white">Debug Metrics</h3>
        <button
          onClick={onClose}
          className="rounded px-1.5 py-0.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>

      {/* Connection */}
      <Section title="Connection">
        <Row
          label="WebSocket"
          value={connectionStatus}
          className={statusColor[connectionStatus]}
        />
        <Row label="Sync" value={syncStatus} />
        <Row
          label="Reconnections"
          value={String(metrics.reconnectCount)}
        />
      </Section>

      {/* Timing */}
      <Section title="Timing">
        <Row
          label="Initial sync"
          value={
            metrics.initialSyncMs !== null
              ? `${metrics.initialSyncMs} ms`
              : "—"
          }
        />
        <Row
          label="Edit latency (avg)"
          value={
            metrics.editLatencyMs !== null
              ? `${metrics.editLatencyMs} ms`
              : "—"
          }
        />
      </Section>

      {/* Activity */}
      <Section title="Activity">
        <Row
          label="Remote updates"
          value={String(metrics.remoteUpdates)}
        />
        <Row
          label="Session uptime"
          value={formatUptime(now)}
        />
      </Section>

      <p className="mt-3 text-[10px] text-gray-600">
        Toggle: Ctrl/Cmd + Shift + D
      </p>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <h4 className="mb-1 font-medium text-gray-400">{title}</h4>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={className ?? "font-mono text-gray-200"}>{value}</span>
    </div>
  );
}

function formatUptime(nowMs: number): string {
  const sec = Math.floor(nowMs / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
