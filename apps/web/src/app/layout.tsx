import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Duo — Real-Time Collaborative Code Editor",
  description:
    "Collaborate on code in real time with zero merge conflicts, powered by CRDTs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
