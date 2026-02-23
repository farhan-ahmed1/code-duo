import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="footer-left">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Image src="/logo.svg" alt="CodeDuo logo" width={20} height={20} className="nav-logo-img" />
          <span>CodeDuo</span>
        </div>
        <span>© 2026</span>
      </div>
      <ul className="footer-links">
        <li><a href="#">Docs</a></li>
        <li>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li><a href="#">Privacy</a></li>
        <li><a href="#">Terms</a></li>
      </ul>
    </footer>
  );
}
