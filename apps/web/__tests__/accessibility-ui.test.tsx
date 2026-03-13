import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AccessibilityAnnouncer from "../src/components/AccessibilityAnnouncer";
import ConnectionStatusIndicator from "../src/components/editor/ConnectionStatusIndicator";
import ShareLinkButton from "../src/components/room/ShareLinkButton";

describe("editor-adjacent accessibility", () => {
  it("does not announce pre-existing collaborators on initial render", () => {
    render(
      <AccessibilityAnnouncer
        connectionStatus="connected"
        remoteUsers={[
          {
            id: "user-1",
            name: "Avery",
            color: "#00a86b",
            connectedAt: Date.now(),
          },
        ]}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("announces connection status changes", () => {
    const { rerender } = render(
      <AccessibilityAnnouncer connectionStatus="connecting" remoteUsers={[]} />,
    );

    rerender(
      <AccessibilityAnnouncer connectionStatus="disconnected" remoteUsers={[]} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Disconnected from collaboration server. Your edits are saved locally and will sync when reconnected.",
    );
  });

  it("announces user join and leave events after hydration", () => {
    const { rerender } = render(
      <AccessibilityAnnouncer connectionStatus="connected" remoteUsers={[]} />,
    );

    rerender(
      <AccessibilityAnnouncer
        connectionStatus="connected"
        remoteUsers={[
          {
            id: "user-2",
            name: "Blake",
            color: "#0ea5e9",
            connectedAt: Date.now(),
          },
        ]}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Blake joined the room");

    rerender(
      <AccessibilityAnnouncer connectionStatus="connected" remoteUsers={[]} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Blake left the room");
  });

  it("exposes the connection status details as a keyboard-focusable button", () => {
    render(
      <ConnectionStatusIndicator status="connected" syncStatus="synced" />,
    );

    expect(
      screen.getByRole("button", { name: "Connection status: Connected" }),
    ).toBeInTheDocument();
  });

  it("labels the share controls and announces a successful copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<ShareLinkButton roomId="room-123" />);

    expect(
      screen.getByRole("textbox", { name: "Room share URL" }),
    ).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: "Copy room link" });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/room/room-123`,
      );
    });

    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "Room link copied to clipboard",
    );
  });
});