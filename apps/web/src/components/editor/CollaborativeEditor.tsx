"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { EditorLanguage } from "@code-duo/shared/src/types";
import CursorOverlay from "./CursorOverlay";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import type { WebsocketProvider } from "y-websocket";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CollaborativeEditorProps {
  ytext: Y.Text | null;
  awareness: Awareness | null;
  provider: WebsocketProvider | null;
  language: EditorLanguage;
  theme: "vs-dark" | "light";
  /** Callback fired when the Monaco editor instance is ready. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditorReady?: (editor: any) => void;
}

/**
 * Full-featured collaborative Monaco editor.
 *
 * Binds a shared `Y.Text` to the editor via `y-monaco` and renders
 * floating name labels above remote cursors through `CursorOverlay`.
 *
 * Language and theme are controlled externally (synced via Y.Map and
 * Zustand respectively) and applied to the Monaco model / editor
 * whenever they change.
 */
export default function CollaborativeEditor({
  ytext,
  awareness,
  provider,
  language,
  theme,
  onEditorReady,
}: CollaborativeEditorProps) {
  const { status } = useConnectionStatus(provider);
  const bindingRef = useRef<MonacoBinding | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorInstance, setEditorInstance] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [monacoInstance, setMonacoInstance] = useState<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Create the y-monaco binding once the editor, ytext, and awareness are all available.
  useEffect(() => {
    if (!editorInstance || !ytext || !awareness) return;

    const editor = editorInstance;
    let binding: MonacoBinding | null = null;
    let cancelled = false;

    // Dynamic import keeps y-monaco (which touches `window`) out of SSR evaluation
    import("y-monaco").then(({ MonacoBinding: MB }) => {
      if (cancelled || !editor.getModel()) return;
      binding = new MB(ytext, editor.getModel()!, new Set([editor]), awareness);
      bindingRef.current = binding;
    });

    return () => {
      cancelled = true;
      binding?.destroy();
      bindingRef.current = null;
    };
  }, [ytext, awareness, editorInstance]);

  // Sync language changes to the Monaco model
  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;
    const model = editorInstance.getModel();
    if (!model) return;
    monacoInstance.editor.setModelLanguage(model, language);
  }, [language, editorInstance, monacoInstance]);

  // Track whether the editor content is empty for the placeholder overlay
  useEffect(() => {
    if (!editorInstance) return;
    const model = editorInstance.getModel();
    if (!model) return;

    function checkEmpty() {
      setIsEmpty(model.getValue().length === 0);
    }
    checkEmpty();
    const disposable = model.onDidChangeContent(checkEmpty);
    return () => disposable.dispose();
  }, [editorInstance]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorMount(editor: any, monaco: any) {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
    // Auto-focus the editor when entering a room
    editor.focus();
    onEditorReady?.(editor);
  }

  return (
    <div className="relative h-full w-full" role="region" aria-label="Collaborative code editor">
      {/* Subtle offline banner */}
      {status === "disconnected" && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-900/80 px-3 py-1.5 text-xs text-red-200"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
          Offline — your edits are saved locally and will sync when reconnected
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage={language}
        theme={theme}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: "on",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
        }}
        onMount={handleEditorMount}
        loading={
          <div className="flex h-full flex-col bg-[hsl(220,18%,7%)]">
            {/* Skeleton toolbar */}
            <div className="flex h-10 items-center gap-3 border-b border-gray-800 px-4">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-800" />
            </div>
            {/* Skeleton line numbers + code lines */}
            <div className="flex flex-1 gap-4 p-4">
              <div className="flex flex-col gap-2">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="h-3 w-6 animate-pulse rounded bg-gray-800/60" />
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {[85, 70, 55, 90, 40, 75, 60, 50, 80, 65, 45, 70, 55, 85, 30, 75, 60, 50].map(
                  (w, i) => (
                    <div
                      key={i}
                      className="h-3 animate-pulse rounded bg-gray-800/40"
                      style={{ width: `${w}%` }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        }
      />
      {/* Empty state placeholder */}
      {isEmpty && editorInstance && (
        <div
          className="pointer-events-none absolute left-16 top-1 select-none text-sm text-muted-foreground/40 font-mono"
          aria-hidden="true"
        >
          Start typing to begin collaborating...
        </div>
      )}
      <CursorOverlay
        awareness={awareness}
        ytext={ytext}
        editorInstance={editorInstance}
      />
    </div>
  );
}
