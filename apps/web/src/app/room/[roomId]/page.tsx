import CollaborativeEditor from '@/components/editor/CollaborativeEditor';
import PresenceBar from '@/components/presence/PresenceBar';
import EditorToolbar from '@/components/editor/EditorToolbar';

interface RoomPageProps {
  params: { roomId: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = params;

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <EditorToolbar roomId={roomId} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor roomId={roomId} />
        </div>
        <PresenceBar />
      </div>
    </div>
  );
}
