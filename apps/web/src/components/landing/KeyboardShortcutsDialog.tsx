"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["C"], description: "Create a new room" },
  { keys: ["J"], description: "Join an existing room" },
  { keys: ["⌘", "S"], description: "Auto-saved — triggers confirmation toast" },
  { keys: ["⌘", "K"], description: "Quick room switcher / command palette" },
  { keys: ["?"], description: "Show this help dialog" },
  { keys: ["Esc"], description: "Close dialogs and overlays" },
];

export default function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only trigger on "?" when no modifier keys and no input is focused
    if (
      e.key === "?" &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement).tagName,
      )
    ) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-white/[0.08] bg-[#1e1e2e] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white/90 font-mono text-base">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-1">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              <span className="text-sm text-white/50">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-white/10 bg-white/[0.05] px-1.5 font-mono text-[11px] text-white/60"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <p className="text-center text-[11px] text-white/25">
            Press{" "}
            <kbd className="mx-0.5 rounded border border-white/10 bg-white/[0.05] px-1 font-mono text-[10px] text-white/40">
              ?
            </kbd>{" "}
            to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
