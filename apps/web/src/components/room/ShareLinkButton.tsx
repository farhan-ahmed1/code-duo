'use client';

import { useState } from 'react';

interface ShareLinkButtonProps {
  roomId: string;
}

export default function ShareLinkButton({ roomId }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-600 transition-colors"
    >
      {copied ? 'Copied!' : 'Share Link'}
    </button>
  );
}
