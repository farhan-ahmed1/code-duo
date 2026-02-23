import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeDuo — Real-time collaborative coding",
  description:
    "Real-time collaborative editing powered by CRDTs. No merge hell, no polling. Just open a room and code.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "CodeDuo — Real-time collaborative coding",
    description:
      "Real-time collaborative editing powered by CRDTs. No merge hell, no polling. Just open a room and code.",
    images: [{ url: "/logo.svg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
        {children}
      </body>
    </html>
  );
}
