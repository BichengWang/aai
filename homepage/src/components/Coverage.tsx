import { Link } from "react-router-dom";
import { coverageAreas } from "../data/homeContent";

export default function Coverage() {
  return (
    <section className="section alt">
      <div className="container coverage-grid">
        <div>
          <span className="pill">Coverage</span>
          <h2 className="section-title">Serving the Bay Area first</h2>
          <p className="section-subtitle">
            We are live across the San Francisco Bay Area with a growing network
            of providers.
          </p>
          <p className="coverage-note">{coverageAreas.length} cities live today.</p>
          <div className="coverage-list">
            {coverageAreas.map((area) => (
              <span key={area} className="coverage-chip">
                {area}
              </span>
            ))}
          </div>
        </div>
        <div className="coverage-card">
          <div className="coverage-map" aria-hidden="true" />
          <div>
            <h3>Expanding by demand</h3>
            <p>
              Tell us where you need service. We prioritize new regions based on
              verified requests and provider availability.
            </p>
            <Link className="text-link" to="/enquiry">
              Request coverage in a new area
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
