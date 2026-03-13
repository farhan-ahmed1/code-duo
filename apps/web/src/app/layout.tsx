import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

function firstNonEmptyValue(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalizedValue = value?.trim();
    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return undefined;
}

function getMetadataBase(): URL {
  const rawBaseUrl =
    firstNonEmptyValue(
      process.env.NEXT_PUBLIC_BASE_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
    ) ??
    (process.env.NODE_ENV === "production"
      ? "https://codeduo.dev"
      : "http://localhost:3000");

  const normalizedBaseUrl =
    rawBaseUrl.startsWith("http://") || rawBaseUrl.startsWith("https://")
      ? rawBaseUrl
      : `https://${rawBaseUrl}`;

  try {
    return new URL(normalizedBaseUrl);
  } catch {
    return new URL(
      process.env.NODE_ENV === "production"
        ? "https://codeduo.dev"
        : "http://localhost:3000",
    );
  }
}

export const metadata: Metadata = {
  title: {
    default: "Code Duo — Code together, conflict-free",
    template: "%s | Code Duo",
  },
  description:
    "Real-time collaborative coding, powered by CRDTs. Open a room, share the link, and stay in sync with live cursors, offline resilience, and dependable conflict-free editing.",
  keywords: [
    "collaborative coding",
    "real-time collaborative coding",
    "browser-based code editor",
    "pair programming",
    "technical interviews",
    "coding education",
    "CRDT",
    "Yjs",
    "Monaco Editor",
    "collaborative code editor",
    "live cursors",
  ],
  authors: [{ name: "Code Duo" }],
  creator: "Code Duo",
  metadataBase: getMetadataBase(),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Code Duo",
    title: "Code Duo — Code together, conflict-free",
    description:
      "Real-time collaborative coding, powered by CRDTs. Open a room, share the link, and stay in sync with live cursors and dependable conflict-free editing.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Code Duo — Code together, conflict-free",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Duo — Code together, conflict-free",
    description:
      "Real-time collaborative coding, powered by CRDTs, with live cursors, offline resilience, and dependable conflict-free editing.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
