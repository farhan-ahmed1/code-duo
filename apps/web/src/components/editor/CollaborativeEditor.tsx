"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { EditorLanguage } from "@code-duo/shared/src/types";
import CursorOverlay from "./CursorOverlay";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CollaborativeEditorProps {
  ytext: Y.Text | null;
  awareness: Awareness | null;
  language: EditorLanguage;
  theme: "vs-dark" | "light";
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
  language,
  theme,
}: CollaborativeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorInstance, setEditorInstance] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [monacoInstance, setMonacoInstance] = useState<any>(null);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorMount(editor: any, monaco: any) {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
  }

  return (
    <div className="relative h-full w-full">
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
          <div className="flex h-full items-center justify-center text-gray-500">
            Loading editor…
          </div>
        }
      />
      <CursorOverlay
        awareness={awareness}
        ytext={ytext}
        editorInstance={editorInstance}
      />
    </div>
  );
}
