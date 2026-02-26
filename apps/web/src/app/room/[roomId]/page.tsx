import type { Metadata } from "next";
import RoomClient from "./RoomClient";
import ErrorBoundary from "@/components/ErrorBoundary";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  let roomName = roomId;

  try {
    const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const room = await res.json();
      roomName = room.name || roomId;
    }
  } catch {
    // Fall back to using roomId as the name
  }

  return {
    title: `Code Duo — Room: ${roomName}`,
    description: `Join the collaborative coding session "${roomName}" on Code Duo. Real-time editing powered by CRDTs with live cursors.`,
    openGraph: {
      title: `Code Duo — Room: ${roomName}`,
      description: `Join the collaborative coding session "${roomName}" on Code Duo. Real-time editing powered by CRDTs.`,
      images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Code Duo — Room: ${roomName}`,
      description: `Join the collaborative coding session "${roomName}" on Code Duo.`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <ErrorBoundary>
      <RoomClient roomId={roomId} />
    </ErrorBoundary>
  );
}
