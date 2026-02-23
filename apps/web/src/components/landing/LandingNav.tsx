"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

interface LandingNavProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export default function LandingNav({ onCreateRoom, onJoinRoom }: LandingNavProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const logoSrc = mounted && resolvedTheme === "light" ? "/logo-light.svg" : "/logo.svg";

  return (
    <nav className="landing-nav">
      <Link href="/" className="nav-logo">
        <Image src={logoSrc} alt="CodeDuo logo" width={32} height={32} className="nav-logo-img" />
        CodeDuo
      </Link>
      <ul className="nav-links">
        <li><a href="#">Docs</a></li>
        <li><a href="#">Blog</a></li>
        <li><a href="#">Pricing</a></li>
        <li>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
      </ul>
      <div className="nav-right">
        <ThemeToggle />
        <button onClick={onJoinRoom} className="btn-ghost">
          Join room <span className="kbd">J</span>
        </button>
        <button onClick={onCreateRoom} className="btn-primary">
          Create room{" "}
          <span
            className="kbd"
            style={{
              color: "rgba(0,0,0,0.5)",
              background: "rgba(0,0,0,0.15)",
              borderColor: "rgba(0,0,0,0.2)",
            }}
          >
            C
          </span>
        </button>
      </div>
    </nav>
  );
}
