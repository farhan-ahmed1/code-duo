'use client';

import { useState } from 'react';
import CreateRoomDialog from '@/components/room/CreateRoomDialog';
import JoinRoomForm from '@/components/room/JoinRoomForm';

export default function HomePage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Code Duo</h1>
        <p className="mt-3 text-lg text-gray-400">
          Real-time collaborative coding, powered by CRDTs.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          Create Room
        </button>
        <JoinRoomForm />
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
