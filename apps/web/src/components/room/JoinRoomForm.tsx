'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinRoomForm() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function extractRoomId(raw: string): string {
    // Handle both full URLs and bare room codes
    try {
      const url = new URL(raw);
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] ?? raw;
    } catch {
      return raw.trim();
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const roomId = extractRoomId(input);
    if (!roomId) {
      setError('Enter a room code or URL.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) {
        setError('Room not found.');
        return;
      }
      router.push(`/room/${roomId}`);
    } catch {
      setError('Could not join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter room code or URL"
          className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-600 disabled:opacity-50"
        >
          Join
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
