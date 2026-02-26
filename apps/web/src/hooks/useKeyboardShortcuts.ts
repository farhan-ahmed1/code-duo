"use client";

import { useEffect, useState, useCallback } from "react";

interface ShortcutCallbacks {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

/**
 * Global keyboard shortcuts for the landing page.
 *
 * Bare keys (only when no input is focused):
 * - `C` — open Create Room dialog
 * - `J` — open Join Room dialog
 *
 * Modified keys (always active):
 * - `Ctrl/Cmd + S` — prevents browser save dialog, shows "Auto-saved" toast
 * - `Ctrl/Cmd + K` — opens quick room switcher (placeholder)
 *
 * Returns toast state so the parent can render a non-blocking notification.
 */
export function useKeyboardShortcuts({
  onCreateRoom,
  onJoinRoom,
}: ShortcutCallbacks) {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2200);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement).tagName,
      );

      // Cmd/Ctrl + S — prevent browser save, show auto-saved toast
      if (mod && e.key === "s") {
        e.preventDefault();
        showToast("Auto-saved via CRDT");
        return;
      }

      // Cmd/Ctrl + K — command palette / quick room switcher
      if (mod && e.key === "k") {
        e.preventDefault();
        showToast("Room switcher — coming soon");
        return;
      }

      // Bare keys — only when not typing in an input
      if (!mod && !inInput) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          onCreateRoom();
        }
        if (e.key === "j" || e.key === "J") {
          e.preventDefault();
          onJoinRoom();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast, onCreateRoom, onJoinRoom]);

  return toast;
}
