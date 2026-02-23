"use client";

interface ToastNotificationProps {
  message: string;
  visible: boolean;
}

/**
 * Minimal, non-blocking toast notification.
 * Appears at the bottom-center of the viewport and auto-fades.
 */
export default function ToastNotification({
  message,
  visible,
}: ToastNotificationProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#1e1e2e] px-4 py-2.5 shadow-xl shadow-black/40 backdrop-blur-sm">
        <svg
          className="h-4 w-4 text-[#a6e3a1]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-sm font-medium text-white/70">{message}</span>
      </div>
    </div>
  );
}
