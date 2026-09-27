import { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { services } from "../data/services";

export default function Services() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <span className="pill">Services</span>
          <h1 className="section-title">Find the right local service</h1>
          <p className="section-subtitle">
            Choose a service below to see what we deliver, the typical timeline,
            and how we keep every request compliant.
          </p>
        </div>
        <div className="service-grid">
          {services.map((service, index) => (
            <article
              key={service.slug}
              className="service-card"
              style={{ "--i": index } as CSSProperties}
            >
              <div className="service-card-media">
                <img src={service.image} alt={service.title} loading="lazy" />
                <span className="service-tag">{service.tag}</span>
              </div>
              <div className="service-card-content">
                <p className="eyebrow">{service.tagline}</p>
                <h3>{service.title}</h3>
                <p>{service.shortDescription}</p>
                <div className="offer-highlights">
                  {service.highlights.slice(0, 3).map((highlight) => (
                    <span key={highlight} className="chip">
                      {highlight}
                    </span>
                  ))}
                </div>
                <div className="service-card-actions">
                  <Link className="button" to={`/services/${service.slug}`}>
                    View details
                  </Link>
                  <Link className="text-link" to="/enquiry">
                    Start an enquiry
                  </Link>
                  {service.websiteUrl && (
                    <a className="text-link" href={service.websiteUrl} target="_blank" rel="noopener noreferrer">
                      Visit website
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
