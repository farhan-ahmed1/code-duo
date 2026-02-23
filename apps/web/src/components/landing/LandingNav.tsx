"use client";

import Link from "next/link";
import Image from "next/image";

interface LandingNavProps {
  onCreateRoom: () => void;
}

export default function LandingNav({ onCreateRoom }: LandingNavProps) {
  return (
    <nav className="landing-nav">
      <Link href="/" className="nav-logo">
        <Image src="/logo.svg" alt="CodeDuo logo" width={32} height={32} className="nav-logo-img" />
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
        <a href="#" className="btn-ghost">
          Sign in <span className="kbd">S</span>
        </a>
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
