import { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { services } from "../data/services";

export default function Offers() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="pill">Services</span>
          <h2 className="section-title">Services built for everyday needs</h2>
          <p className="section-subtitle">
            We take your request, verify availability, and connect you with
            trusted providers who can help right away.
          </p>
        </div>
        <div className="offer-grid">
          {services.map((service, index) => (
            <article
              key={service.title}
              className="offer-card"
              style={{ "--i": index } as CSSProperties}
            >
              <div className="offer-header">
                <img
                  className="offer-icon-image"
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                />
                <span className="offer-tag">{service.tag}</span>
              </div>
              <h3>{service.title}</h3>
              <p className="offer-tagline">{service.tagline}</p>
              <p>{service.shortDescription}</p>
              <div className="offer-highlights">
                {service.highlights.slice(0, 3).map((highlight) => (
                  <span key={highlight} className="chip">
                    {highlight}
                  </span>
                ))}
              </div>
              <Link className="text-link" to={`/services/${service.slug}`}>
                Learn more
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
