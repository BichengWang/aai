import { Link } from "react-router-dom";
import { isExternalUrl, linkTargetProps } from "../lib/links";
import { usePageTitle } from "../lib/usePageChrome";
import LabPageHead from "../components/lab/LabPageHead";
import ServicePlate from "../components/lab/ServicePlate";
import { services } from "../data/services";

export default function Services() {
  usePageTitle("Services");
  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["Services", "Index"]}
        title="Find the right local service"
        lede="Choose a service below to see what we deliver, the typical timeline, and how we keep every request compliant."
        actions={
          <Link className="lab-btn lab-btn--primary" to="/enquiry">
            Start an enquiry
            <span className="lab-btn-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        }
      />

      <section className="lab-section" aria-label="Service lines">
        <div className="container">
          <ol className="lab-svc-grid" role="list">
            {services.map((service, index) => {
              const outcome = service.outcomes[0];
              return (
                <li key={service.slug} className="lab-svc-card lab-reveal">
                  <ServicePlate id={`D-0${index + 1}`} tag={service.tag} index={index} />
                  <p className="lab-micro">{service.tagline}</p>
                  <h2 className="lab-title">
                    <Link className="lab-svc-link" to={`/services/${service.slug}`}>
                      {service.title}
                    </Link>
                  </h2>
                  <p className="lab-body">{service.shortDescription}</p>
                  <ul className="lab-svc-hl lab-data" role="list">
                    {service.highlights.slice(0, 3).map((highlight) => (
                      <li key={highlight}>
                        <span aria-hidden="true">— </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  {outcome ? (
                    <dl className="lab-svc-metric">
                      <dt className="lab-micro">{outcome.label}</dt>
                      <dd>{outcome.value}</dd>
                    </dl>
                  ) : null}
                  <div className="lab-svc-actions">
                    <Link className="lab-btn lab-btn--primary" to={`/services/${service.slug}`}>
                      View details
                    </Link>
                    <Link className="lab-link" to="/enquiry">
                      Start an enquiry
                    </Link>
                    {service.websiteUrl ? (
                      <a
                        className="lab-link"
                        href={service.websiteUrl}
                        {...linkTargetProps(service.websiteUrl)}
                      >
                        {service.websiteLabel ?? "Visit website"}
                        <span aria-hidden="true">
                          {isExternalUrl(service.websiteUrl) ? " ↗" : " →"}
                        </span>
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="lab-section lab-section--band" aria-labelledby="lab-svc-cta-title">
        <div className="container lab-grid lab-cta">
          <p className="lab-label">Not sure yet</p>
          <div className="lab-cta-main">
            <h2 id="lab-svc-cta-title" className="lab-h2">
              Describe the request. We will route it.
            </h2>
            <p className="lab-intro">
              One enquiry is enough. We check availability, compliance fit and the
              right provider, then follow up within 24 hours.
            </p>
            <div className="lab-pagehead-actions">
              <Link className="lab-btn lab-btn--primary" to="/enquiry">
                Start an enquiry
              </Link>
              <Link className="lab-btn lab-btn--ghost" to="/enquiry">
                Contact the team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
