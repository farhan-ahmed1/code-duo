'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useYjs } from '@/hooks/useYjs';
import { MonacoBinding } from 'y-monaco';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CollaborativeEditorProps {
  roomId: string;
}

export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const { ydoc, provider, ytext, isConnected } = useYjs(roomId);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      provider?.destroy();
      ydoc?.destroy();
    };
  }, [provider, ydoc]);

  function handleEditorMount(editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0], monaco: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[1]) {
    if (!ytext || !provider) return;
    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness,
    );
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
