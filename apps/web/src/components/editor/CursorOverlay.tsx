"use client";

// CursorOverlay renders floating name labels above remote cursors.
// It complements the y-monaco MonacoBinding which handles cursor line decorations.

interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  top: number;
  left: number;
}

interface CursorOverlayProps {
  cursors: RemoteCursor[];
}

export default function CursorOverlay({ cursors }: CursorOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-white"
          style={{
            top: cursor.top,
            left: cursor.left,
            backgroundColor: cursor.color,
            transform: "translateY(-100%)",
          }}
        >
          {cursor.name}
        </div>
      ))}
    </div>
  );
}
