import StepsSection from "./StepsSection";

export default function HowItWorksSection() {
  return (
    <section className="how-section">
      <div className="container">
        <div className="section-label">How it works</div>
        <h2 className="section-title">
          Up in <span style={{ color: "var(--blue)" }}>three</span> steps
        </h2>
        <StepsSection />
      </div>
    </section>
  );
}
