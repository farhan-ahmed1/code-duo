"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Global keyboard shortcuts for the application.
 *
 * - `Ctrl/Cmd + S` — prevents browser save dialog, shows "Auto-saved" toast
 * - `Ctrl/Cmd + K` — opens quick room switcher (placeholder)
 *
 * Returns toast state so the parent can render a non-blocking notification.
 */
export function useKeyboardShortcuts() {
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

      // Cmd/Ctrl + S — prevent browser save, show auto-saved toast
      if (mod && e.key === "s") {
        e.preventDefault();
        showToast("Auto-saved via CRDT");
      }

      // Cmd/Ctrl + K — command palette / quick room switcher
      if (mod && e.key === "k") {
        e.preventDefault();
        showToast("Room switcher — coming soon");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast]);

  return toast;
}
