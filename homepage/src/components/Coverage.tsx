import { Link } from "react-router-dom";
import { coverageCities, stats } from "../data/homeContent";
import LabSectionHead from "./LabSectionHead";
import BayAreaFigure from "./lab/BayAreaFigure";

const formatCoordinates = (lat: number, lon: number) =>
  `${lat.toFixed(2)}° N, ${Math.abs(lon).toFixed(2)}° W`;

export default function Coverage() {
  return (
    <section id="coverage" className="lab-section" aria-labelledby="lab-coverage-title">
      <div className="container">
        <LabSectionHead
          index="05"
          label="Coverage"
          titleId="lab-coverage-title"
          title="Deployed across the Bay Area"
          intro={`Live in ${coverageCities.length} cities today, backed by ${stats.verifiedProviders} verified providers. We open new regions based on verified requests and provider availability.`}
        />
        <div className="lab-grid lab-coverage-grid">
          <div className="lab-coverage-list">
            <ol className="lab-cities lab-reveal" role="list">
              {coverageCities.map((city, index) => (
                <li key={city.name} className="lab-city">
                  <span className="lab-city-num lab-micro">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="lab-city-name">{city.name}</span>
                  <span className="lab-city-coords lab-data">
                    {formatCoordinates(city.lat, city.lon)}
                  </span>
                  <span className="lab-city-status lab-micro">
                    <span className="lab-dot" aria-hidden="true" />
                    Live
                  </span>
                </li>
              ))}
            </ol>
            <p className="lab-coverage-cta">
              Need service somewhere else?{" "}
              <Link className="lab-link" to="/enquiry">
                Request coverage in a new area
              </Link>{" "}
              <span aria-hidden="true">→</span>
            </p>
          </div>
          <BayAreaFigure />
        </div>
      </div>
    </section>
  );
}
