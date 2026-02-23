import RoomClient from "./RoomClient";
import ErrorBoundary from "@/components/ErrorBoundary";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <ErrorBoundary>
      <RoomClient roomId={roomId} />
    </ErrorBoundary>
  );
}
