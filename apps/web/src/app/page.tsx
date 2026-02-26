"use client";

import { useState } from "react";
import CreateRoomDialog from "@/components/room/CreateRoomDialog";
import JoinRoomDialog from "@/components/room/JoinRoomDialog";
import KeyboardShortcutsDialog from "@/components/landing/KeyboardShortcutsDialog";
import ToastNotification from "@/components/landing/ToastNotification";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import EditorDemoSection from "@/components/landing/EditorDemoSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const handleCreate = () => setCreateOpen(true);
  const handleJoin = () => setJoinOpen(true);
  const toast = useKeyboardShortcuts({
    onCreateRoom: handleCreate,
    onJoinRoom: handleJoin,
  });

  return (
    <>
      <div className="landing-page">
        <LandingNav onCreateRoom={handleCreate} onJoinRoom={handleJoin} />
        <HeroSection onCreateRoom={handleCreate} onJoinRoom={handleJoin} />
        <EditorDemoSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection onCreateRoom={handleCreate} />
        <LandingFooter />
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
      <KeyboardShortcutsDialog />
      <ToastNotification message={toast.message} visible={toast.visible} />
    </>
  );
}
