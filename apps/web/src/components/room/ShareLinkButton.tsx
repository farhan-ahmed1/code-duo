"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareLinkButtonProps {
  roomId: string;
}

export default function ShareLinkButton({ roomId }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/room/${roomId}`);
  }, [roomId]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        readOnly
        value={url}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        className="h-8 flex-1 border-border bg-secondary text-xs font-mono text-muted-foreground select-all cursor-text"
        aria-label="Room share URL"
      />
      <TooltipProvider delayDuration={0}>
        <Tooltip open={copied ? true : undefined}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                    <polyline points="3.5 8.5 6 11 12.5 4.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                    <path d="M10.5 5.5V3.5a1.5 1.5 0 00-1.5-1.5H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5h2" />
                  </svg>
                  Share
                </>
              )}
            </Button>
          </TooltipTrigger>
          {copied && (
            <TooltipContent side="top" className="text-xs">
              Link copied to clipboard!
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
