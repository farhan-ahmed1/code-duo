'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MonacoBinding } from 'y-monaco';
import type * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import type { Awareness } from 'y-protocols/awareness';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CollaborativeEditorProps {
  roomId: string;
  ytext: Y.Text | null;
  provider: WebsocketProvider | null;
  awareness: Awareness | null;
}

export default function CollaborativeEditor({
  roomId,
  ytext,
  provider,
  awareness,
}: CollaborativeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0] | null>(null);
  // State flag so the effect re-runs when the editor becomes available,
  // regardless of whether Yjs state arrived before or after Monaco mounted.
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current || !ytext || !awareness) return;

    const editor = editorRef.current;
    let binding: MonacoBinding | null = null;
    let cancelled = false;

    // Dynamic import keeps y-monaco (which touches `window`) out of SSR evaluation
    import('y-monaco').then(({ MonacoBinding: MB }) => {
      if (cancelled || !editor.getModel()) return;
      binding = new MB(ytext, editor.getModel()!, new Set([editor]), awareness);
      bindingRef.current = binding;
    });

    return () => {
      cancelled = true;
      binding?.destroy();
      bindingRef.current = null;
    };
  }, [ytext, awareness, editorReady]);

  function handleEditorMount(
    editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0],
    _monaco: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[1],
  ) {
    editorRef.current = editor;
    // Signal the effect — if ytext is already available the binding is created
    // immediately; if not, the effect will fire again once ytext is set.
    setEditorReady(true);
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
        }}
        onMount={handleEditorMount}
        loading={
          <div className="flex h-full items-center justify-center text-gray-500">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
