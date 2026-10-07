import { Link } from "react-router-dom";
import { coverageCities, metrics } from "../data/homeContent";
import AquilaFigure from "./lab/AquilaFigure";

const heroMetrics = [
  ...metrics,
  { label: "Bay Area cities live", value: String(coverageCities.length) },
];

export default function Hero() {
  return (
    <section className="lab-hero lab-night" aria-labelledby="lab-hero-title">
      <div className="lab-hero-field" aria-hidden="true" />
      <div className="container lab-hero-grid">
        <div className="lab-hero-copy">
          <p className="lab-kicker lab-micro">
            <span>Altair AI LLC</span>
            <span className="lab-kicker-sep" aria-hidden="true">
              /
            </span>
            <span>Applied AI lab</span>
            <span className="lab-kicker-sep lab-kicker-sep--loc" aria-hidden="true">
              /
            </span>
            <span className="lab-kicker-loc">San Francisco Bay Area</span>
          </p>
          <h1 id="lab-hero-title" className="lab-display">
            Applied AI for the services{" "}
            <em>people rely on.</em>
          </h1>
          <p className="lab-lede">
            We build AI systems for intake, verification and matching, and run
            them in real local-service workflows across the Bay Area — alongside
            tools like our document review workspace.
          </p>
          <div className="lab-hero-actions">
            <Link className="lab-btn lab-btn--primary" to="/enquiry">
              Start an enquiry
              <span className="lab-btn-arrow" aria-hidden="true">
                →
              </span>
            </Link>
            <Link className="lab-btn lab-btn--ghost" to="/services">
              Browse services
            </Link>
          </div>
          <p className="lab-hero-note lab-micro">
            Free to start · No subscription or credit fees
          </p>
          <a
            className="lab-partner-badge"
            href="https://claude.com/partners"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/images/claude-partner-network.png"
              alt="Certified Claude Partner Network member"
              width={800}
              height={64}
            />
          </a>
        </div>
        <AquilaFigure />
        <dl className="lab-metrics">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="lab-metric">
              <dt className="lab-micro">{metric.label}</dt>
              <dd className="lab-metric-value">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
