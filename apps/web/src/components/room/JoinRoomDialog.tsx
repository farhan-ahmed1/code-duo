"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import JoinRoomForm from "./JoinRoomForm";

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JoinRoomDialog({
  open,
  onOpenChange,
}: JoinRoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Join a room</DialogTitle>
          <DialogDescription>
            Paste a room code or full URL to jump straight in.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <JoinRoomForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
