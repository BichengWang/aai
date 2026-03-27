import { Link } from "react-router-dom";
import { metrics } from "../data/homeContent";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-surface">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Altair AI LLC</span>
            <h1 className="hero-title">
              Local services, matched by AI and vetted for compliance.
            </h1>
            <p className="hero-subtitle">
              Altair connects you with trusted providers through clear intake,
              fast availability checks, and transparent updates.
            </p>
            <p className="hero-subtitle">
              No subscription or credit fees. Share your email and postcode to
              get started, or browse services first.
            </p>
            <div className="hero-form">
              <label>
                Email
                <input
                  className="input"
                  type="email"
                  placeholder="name@email.com"
                  aria-label="Email"
                />
              </label>
              <label>
                Postcode
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your postcode"
                  aria-label="Postcode"
                />
              </label>
              <div className="hero-actions">
                <Link className="button" to="/enquiry">
                  Start an enquiry
                </Link>
                <Link className="button ghost" to="/services">
                  Browse services
                </Link>
              </div>
            </div>
            <div className="hero-metrics">
              {metrics.map((metric) => (
                <div key={metric.label} className="hero-metric">
                  <p className="metric-value">{metric.value}</p>
                  <p className="metric-label">{metric.label}</p>
                </div>
              ))}
            </div>
            <p className="hero-note">
              Currently serving the San Francisco Bay Area.
            </p>
          </div>
          <div className="hero-visual">
            <div className="hero-panel">
              <div className="panel-header">
                <span className="panel-status">
                  <span className="status-dot" aria-hidden="true" /> Live
                  availability
                </span>
                <span className="pill ghost">Bay Area</span>
              </div>
              <h3>We match requests in under 10 minutes.</h3>
              <p>
                Our intake engine checks capacity, compliance, and response
                times so you do not have to.
              </p>
              <div className="panel-stats">
                <div>
                  <p className="metric-value">98%</p>
                  <p className="metric-label">Response rate</p>
                </div>
                <div>
                  <p className="metric-value">4.9</p>
                  <p className="metric-label">Average rating</p>
                </div>
                <div>
                  <p className="metric-value">24 hrs</p>
                  <p className="metric-label">Follow-up</p>
                </div>
              </div>
            </div>
            <div className="hero-panel minor">
              <p className="panel-title">Recent matches</p>
              <div className="panel-list">
                <div className="panel-item">
                  <p className="panel-item-title">Estate planning</p>
                  <span className="panel-item-meta">Oakland · Confirmed</span>
                </div>
                <div className="panel-item">
                  <p className="panel-item-title">Pet sitting</p>
                  <span className="panel-item-meta">San Jose · In progress</span>
                </div>
                <div className="panel-item">
                  <p className="panel-item-title">Car rental</p>
                  <span className="panel-item-meta">San Mateo · New request</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
