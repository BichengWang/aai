import { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { services } from "../data/services";

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    return (
      <section className="page-section">
        <div className="container">
          <h1 className="section-title">Service not found</h1>
          <p className="section-subtitle">
            The service you are looking for is not available yet.
          </p>
          <Link className="button" to="/services">
            Back to services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-section service-hero">
        <div className="container split-layout">
          <div>
            <span className="pill">{service.tag}</span>
            <p className="eyebrow">{service.tagline}</p>
            <h1 className="section-title">{service.title}</h1>
            <p className="section-subtitle">{service.description}</p>
            <div className="bullet-list">
              {service.highlights.map((highlight) => (
                <div key={highlight} className="bullet-item">
                  <span aria-hidden="true">+</span>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
            <div className="hero-actions">
              <Link className="button" to="/enquiry">
                Start an enquiry
              </Link>
              <Link className="button ghost" to="/services">
                Back to services
              </Link>
              {service.websiteUrl && (
                <a className="button ghost" href={service.websiteUrl} target="_blank" rel="noopener noreferrer">
                  Visit website
                </a>
              )}
            </div>
          </div>
          <div className="card-panel service-media">
            <img src={service.image} alt={service.title} />
            <div className="service-metrics">
              {service.outcomes.map((metric) => (
                <div key={metric.label} className="metric-item">
                  <p className="metric-value">{metric.value}</p>
                  <p className="metric-label">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-layout">
          <div className="card-panel">
            <h2>Who this is for</h2>
            <div className="stack-list">
              {service.suitedFor.map((item) => (
                <span key={item} className="stack-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="card-panel">
            <h2>What you receive</h2>
            <div className="stack-list">
              {service.deliverables.map((item) => (
                <span key={item} className="stack-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-header">
            <span className="pill">Process</span>
            <h2 className="section-title">A clear intake timeline</h2>
            <p className="section-subtitle">
              Every request includes transparent steps and status updates.
            </p>
          </div>
          <div className="timeline-grid">
            {service.timeline.map((step, index) => (
              <article
                key={step.title}
                className="timeline-card"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-layout">
          <div>
            <span className="pill">Compliance</span>
            <h2 className="section-title">Compliance and care built in</h2>
            <p className="section-subtitle">
              We keep intake aligned with regulatory requirements and protect
              your information at every step.
            </p>
          </div>
          <div className="card-panel">
            <div className="stack-list">
              {service.compliance.map((item) => (
                <span key={item} className="stack-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="pill">FAQ</span>
            <h2 className="section-title">Service questions</h2>
          </div>
          <div className="faq-grid">
            {service.faqs.map((item, index) => (
              <div
                key={item.question}
                className="faq-card"
                style={{ "--i": index } as CSSProperties}
              >
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
