"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LandingFooter() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const logoSrc = mounted && resolvedTheme === "light" ? "/logo-light.svg" : "/logo.svg";

  return (
    <footer className="landing-footer">
      <div className="footer-left">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Image src={logoSrc} alt="CodeDuo logo" width={24} height={24} className="nav-logo-img" />
          <span>CodeDuo</span>
        </div>
        <span>© 2026</span>
      </div>
      <ul className="footer-links">
        <li><a href="#">Docs</a></li>
        <li>
          <a href="https://github.com/farhan-ahmed1/code-duo" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li><a href="#">Privacy</a></li>
        <li><a href="#">Terms</a></li>
      </ul>
    </footer>
  );
}
