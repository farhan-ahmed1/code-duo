import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectionStatus } from "../src/hooks/useConnectionStatus";
import type { WebsocketProvider } from "y-websocket";

// Minimal mock of WebsocketProvider with event emitter interface
type MockProvider = WebsocketProvider & {
  emit: (event: string, ...args: unknown[]) => void;
  getListenerCount: (event: string) => number;
};

function createMockProvider(): MockProvider {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  return {
    on(event: string, fn: (...args: unknown[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off(event: string, fn: (...args: unknown[]) => void) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },
    getListenerCount(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  } as MockProvider;
}

describe("useConnectionStatus", () => {
  it("defaults to connecting / syncing when provider is null", () => {
    const { result } = renderHook(() => useConnectionStatus(null));
    expect(result.current.status).toBe("connecting");
    expect(result.current.syncStatus).toBe("syncing");
  });

  it("defaults to connecting / syncing before any events", () => {
    const provider = createMockProvider();
    const { result } = renderHook(() =>
      useConnectionStatus(provider),
    );
    expect(result.current.status).toBe("connecting");
    expect(result.current.syncStatus).toBe("syncing");
  });

  it("updates status to connected on status event", () => {
    const provider = createMockProvider();
    const { result } = renderHook(() =>
      useConnectionStatus(provider),
    );

    act(() => {
      provider.emit("status", { status: "connected" });
    });

    expect(result.current.status).toBe("connected");
  });

  it("updates status to disconnected on status event", () => {
    const provider = createMockProvider();
    const { result } = renderHook(() =>
      useConnectionStatus(provider),
    );

    act(() => {
      provider.emit("status", { status: "connected" });
    });
    expect(result.current.status).toBe("connected");

    act(() => {
      provider.emit("status", { status: "disconnected" });
    });
    expect(result.current.status).toBe("disconnected");
  });

  it("updates syncStatus to synced when sync event fires true", () => {
    const provider = createMockProvider();
    const { result } = renderHook(() =>
      useConnectionStatus(provider),
    );

    act(() => {
      provider.emit("sync", true);
    });

    expect(result.current.syncStatus).toBe("synced");
  });

  it("updates syncStatus to syncing when sync event fires false", () => {
    const provider = createMockProvider();
    const { result } = renderHook(() =>
      useConnectionStatus(provider),
    );

    act(() => {
      provider.emit("sync", true);
    });
    expect(result.current.syncStatus).toBe("synced");

    act(() => {
      provider.emit("sync", false);
    });
    expect(result.current.syncStatus).toBe("syncing");
  });

  it("cleans up event listeners on unmount", () => {
    const provider = createMockProvider();
    const { unmount } = renderHook(() =>
      useConnectionStatus(provider),
    );

    expect(provider.getListenerCount("status")).toBe(1);
    expect(provider.getListenerCount("sync")).toBe(1);

    unmount();

    expect(provider.getListenerCount("status")).toBe(0);
    expect(provider.getListenerCount("sync")).toBe(0);
  });

  it("resubscribes when provider changes", () => {
    const provider1 = createMockProvider();
    const provider2 = createMockProvider();

    const { rerender } = renderHook(
      ({ provider }) => useConnectionStatus(provider),
      { initialProps: { provider: provider1 } },
    );

    expect(provider1.getListenerCount("status")).toBe(1);

    rerender({ provider: provider2 });

    // Old provider cleaned up
    expect(provider1.getListenerCount("status")).toBe(0);
    // New provider subscribed
    expect(provider2.getListenerCount("status")).toBe(1);
  });

  it("handles full connection lifecycle: connecting → connected → synced → disconnected", () => {
    const provider = createMockProvider();
    const { result } = renderHook(() =>
      useConnectionStatus(provider),
    );

    // Initial state
    expect(result.current.status).toBe("connecting");
    expect(result.current.syncStatus).toBe("syncing");

    // Connected
    act(() => provider.emit("status", { status: "connected" }));
    expect(result.current.status).toBe("connected");

    // Synced
    act(() => provider.emit("sync", true));
    expect(result.current.syncStatus).toBe("synced");

    // Disconnected
    act(() => provider.emit("status", { status: "disconnected" }));
    expect(result.current.status).toBe("disconnected");
    // Sync status stays synced — it tracks initial sync, not connection
    expect(result.current.syncStatus).toBe("synced");
  });
});
