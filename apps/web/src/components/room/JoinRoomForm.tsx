"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function JoinRoomForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function extractRoomId(raw: string): string {
    // Handle both full URLs and bare room codes
    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/");
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
      setError("Enter a room code or URL.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}`);
      if (!res.ok) {
        setError("Room not found. Check the code and try again.");
        return;
      }
      router.push(`/room/${roomId}`);
    } catch {
      setError("Could not join room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="w-full">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors focus-within:border-primary/40">
        <Input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste a room code or URL…"
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 text-sm h-8"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          variant="secondary"
          size="sm"
          className="shrink-0 font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" className="opacity-75" />
              </svg>
              Joining…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Join
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </span>
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-1.5 px-1 text-xs text-destructive font-medium">
          {error}
        </p>
      )}
    </form>
  );
}
