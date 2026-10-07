import { Link } from "react-router-dom";
import { coverageCities, metrics } from "../data/homeContent";
import AquilaFigure from "./lab/AquilaFigure";

const heroMetrics = [
  ...metrics,
  { label: "Bay Area cities live", value: String(coverageCities.length) },
];

// Each network's own mark in its reversed (light-on-dark) form, sized to read as
// equals: about the same width, with OpenAI's sans a little smaller in cap
// height than Claude's serif (see .lab-partner--* in home.css).
const partnerNetworks = [
  {
    id: "claude",
    name: "Claude Partner Network",
    href: "https://claude.com/partners",
    src: "/images/partners/claude-partner-network.png",
    width: 800,
    height: 64,
  },
  {
    id: "openai",
    name: "OpenAI Partner Network",
    href: "https://openai.com/business/partners/",
    src: "/images/partners/openai-partner-network.svg",
    width: 400,
    height: 30,
  },
] as const;

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
          <div className="lab-partners">
            <p className="lab-partners-label lab-micro">Partner networks</p>
            <ul className="lab-partners-list" role="list">
              {partnerNetworks.map((partner) => (
                <li key={partner.id}>
                  <a
                    className={`lab-partner lab-partner--${partner.id}`}
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={partner.src}
                      alt={partner.name}
                      width={partner.width}
                      height={partner.height}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
