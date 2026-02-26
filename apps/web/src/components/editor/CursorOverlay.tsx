"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

/** Pixel coordinates for a single remote cursor label. */
interface CursorLabel {
  clientId: number;
  name: string;
  color: string;
  top: number;
  left: number;
}

interface CursorOverlayProps {
  awareness: Awareness | null;
  ytext: Y.Text | null;
  /** The Monaco editor instance (available after the editor mounts). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorInstance: any;
}

/** Labels fade out after this many ms of cursor inactivity. */
const FADE_TIMEOUT_MS = 3_000;

/**
 * Renders floating name labels above each remote user's cursor.
 *
 * `y-monaco`'s `MonacoBinding` already handles the colored cursor line
 * decorations inside in the editor via the awareness protocol.  This
 * component adds the *name labels* that float above those cursor lines
 * so collaborators can tell who is editing where.
 *
 * Labels automatically fade out after 3 seconds of cursor inactivity
 * and immediately reappear when the cursor moves again.
 */
export default function CursorOverlay({
  awareness,
  ytext,
  editorInstance,
}: CursorOverlayProps) {
  const [labels, setLabels] = useState<CursorLabel[]>([]);
  const [hiddenClients, setHiddenClients] = useState<Set<number>>(new Set());

  // Mutable refs so we don't re-create the callback on every render.
  const fadeTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const lastPositionsRef = useRef<Map<number, string>>(new Map());

  /** Read awareness states, convert relative cursor positions to pixel
   *  coordinates inside the editor, and schedule fade timers. */
  const computeLabels = useCallback(() => {
    if (!awareness || !ytext || !editorInstance) return;

    const doc = ytext.doc;
    if (!doc) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const states = awareness.getStates();
    const newLabels: CursorLabel[] = [];

    states.forEach(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state: any, clientId: number) => {
        if (clientId === awareness.clientID) return;
        // y-monaco stores cursor data in `selection` (not `cursor`).
        // Both `user` (set by useAwareness) and `selection` (set by MonacoBinding) must exist.
        if (!state.user || !state.selection?.head) return;

        const { user, selection } = state;

        try {
          // Convert the Yjs relative position stored in awareness back to an
          // absolute document offset.
          const headAbs = Y.createAbsolutePositionFromRelativePosition(
            selection.head,
            doc,
          );
          if (!headAbs) return;

          // Translate the text offset to a Monaco line/column, then to pixels.
          const position = model.getPositionAt(headAbs.index);
          const scrolled = editorInstance.getScrolledVisiblePosition(position);
          if (!scrolled) return;

          // --- Fade logic: show on move, hide after 3 s of inactivity ---
          const posKey = `${position.lineNumber}:${position.column}`;
          const prevKey = lastPositionsRef.current.get(clientId);

          if (posKey !== prevKey) {
            lastPositionsRef.current.set(clientId, posKey);

            // Immediately reveal the label
            setHiddenClients((prev) => {
              if (!prev.has(clientId)) return prev;
              const next = new Set(prev);
              next.delete(clientId);
              return next;
            });

            // Reset the fade timer
            const existing = fadeTimersRef.current.get(clientId);
            if (existing) clearTimeout(existing);

            fadeTimersRef.current.set(
              clientId,
              setTimeout(() => {
                setHiddenClients((prev) => {
                  const next = new Set(prev);
                  next.add(clientId);
                  return next;
                });
                fadeTimersRef.current.delete(clientId);
              }, FADE_TIMEOUT_MS),
            );
          }

          newLabels.push({
            clientId,
            name: user.name ?? "Anonymous",
            color: user.color ?? "#888",
            top: scrolled.top,
            left: scrolled.left,
          });
        } catch {
          // Skip cursors whose relative positions can't be resolved
          // (e.g. GC'd items or stale awareness state).
        }
      },
    );

    setLabels(newLabels);
  }, [awareness, ytext, editorInstance]);

  // Subscribe to awareness changes and editor scroll / layout events so
  // the labels stay pinned to the correct editor coordinates.
  useEffect(() => {
    if (!awareness || !editorInstance) return;

    const handler = () => computeLabels();

    awareness.on("change", handler);

    const scrollDisposable = editorInstance.onDidScrollChange(handler);
    const layoutDisposable = editorInstance.onDidLayoutChange(handler);

    // Compute once immediately so labels appear without waiting for an event.
    computeLabels();

    return () => {
      awareness.off("change", handler);
      scrollDisposable.dispose();
      layoutDisposable.dispose();
    };
  }, [awareness, editorInstance, computeLabels]);

  // Clean up fade timers on unmount.
  useEffect(() => {
    const timers = fadeTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Clean up stale entries when a remote user disconnects.
  useEffect(() => {
    if (!awareness) return;

    function handleChange({ removed }: { removed: number[] }) {
      for (const id of removed) {
        lastPositionsRef.current.delete(id);
        const timer = fadeTimersRef.current.get(id);
        if (timer) {
          clearTimeout(timer);
          fadeTimersRef.current.delete(id);
        }
        setHiddenClients((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }

    awareness.on("change", handleChange);
    return () => awareness.off("change", handleChange);
  }, [awareness]);

  if (labels.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {labels.map((label) => (
        <div
          key={label.clientId}
          className="absolute transition-opacity duration-300"
          style={{
            top: label.top,
            left: label.left,
            opacity: hiddenClients.has(label.clientId) ? 0 : 1,
            transform: "translateY(-100%)",
          }}
        >
          <div
            className="whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </div>
        </div>
      ))}
    </div>
  );
}
