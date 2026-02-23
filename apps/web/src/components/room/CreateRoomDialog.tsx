"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "@code-duo/shared/src/constants";
import type { EditorLanguage } from "@code-duo/shared/src/types";

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

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Create a Room</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Coding Session"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as EditorLanguage)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
