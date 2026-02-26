"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

// ── Error categorisation ───────────────────────────────────────────

type ErrorCategory = "websocket" | "monaco" | "room" | "unknown";

function categorizeError(error: Error): ErrorCategory {
  const msg = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    msg.includes("websocket") ||
    msg.includes("ws://") ||
    msg.includes("wss://") ||
    msg.includes("connection") ||
    name.includes("websocket")
  ) {
    return "websocket";
  }

  if (
    msg.includes("monaco") ||
    msg.includes("editor") ||
    msg.includes("loading") ||
    msg.includes("chunk")
  ) {
    return "monaco";
  }

  if (
    msg.includes("room") ||
    msg.includes("404") ||
    msg.includes("not found")
  ) {
    return "room";
  }

  return "unknown";
}

const ERROR_MESSAGES: Record<
  ErrorCategory,
  { title: string; description: string }
> = {
  websocket: {
    title: "Connection Lost",
    description:
      "We couldn't connect to the collaboration server. This could be a network issue or the server may be temporarily unavailable.",
  },
  monaco: {
    title: "Editor Failed to Load",
    description:
      "The code editor couldn't initialize. This is usually caused by a slow network or browser extension interference.",
  },
  room: {
    title: "Room Not Found",
    description:
      "This room doesn't exist or may have expired. Rooms are automatically cleaned up after 7 days of inactivity.",
  },
  unknown: {
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. You can try refreshing the page or creating a new room.",
  },
};

// ── Props & state ──────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback when you want full control of the error UI. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  category: ErrorCategory;
}

// ── Component ──────────────────────────────────────────────────────

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, category: "unknown" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      category: categorizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Structured console logging for debugging
    console.error("[ErrorBoundary]", {
      category: categorizeError(error),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "",
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, category: "unknown" });
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { title, description } = ERROR_MESSAGES[this.state.category];

    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md space-y-6 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to Home
            </button>
          </div>

          {/* Debug info (collapsed) */}
          {this.state.error && (
            <details className="mt-4 rounded-md border border-border p-3 text-left">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Error Details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                {this.state.error.name}: {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
