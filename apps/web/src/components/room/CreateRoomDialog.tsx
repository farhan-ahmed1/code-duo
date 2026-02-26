"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@code-duo/shared";
import type { EditorLanguage } from "@code-duo/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateRoomDialog({
  open,
  onOpenChange,
}: CreateRoomDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<EditorLanguage>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "My Room", language }),
      });

      if (!res.ok) throw new Error("Failed to create room");

      const room = await res.json();
      router.push(`/room/${room.id}`);
      onOpenChange(false);
    } catch (_err) {
      setError("Could not create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create a Room</DialogTitle>
          <DialogDescription>
            Set up a collaborative coding session. Choose a name and language.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="space-y-1.5">
            <label
              htmlFor="room-name"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Room Name
            </label>
            <Input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Coding Session"
              className="bg-secondary border-border focus-visible:ring-primary"
              aria-required="false"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="room-language"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Language
            </label>
            <select
              id="room-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as EditorLanguage)}
              className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option
                  key={lang}
                  value={lang}
                  className="bg-card text-foreground"
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" className="opacity-75" />
                  </svg>
                  Creating…
                </span>
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
