import { Link } from "react-router-dom";
import { services } from "../data/services";
import LabSectionHead from "./LabSectionHead";

export default function Offers() {
  return (
    <section id="deployments" className="lab-section" aria-labelledby="lab-deployments-title">
      <div className="container">
        <LabSectionHead
          index="03"
          label="Deployments"
          titleId="lab-deployments-title"
          title="Services built for everyday needs"
          intro="Four service lines where our intake and matching systems run today. Altair handles intake, verification and matching; vetted local providers deliver the service."
        />
        <ol className="lab-deploy" role="list">
          {services.map((service, index) => {
            const outcome = service.outcomes[0];
            return (
              <li key={service.slug} className="lab-deploy-row lab-reveal">
                <p className="lab-deploy-id lab-micro">
                  {`D-0${index + 1}`}
                  <span className="lab-deploy-tag"> · {service.tag}</span>
                </p>
                <span className="lab-deploy-glyph" aria-hidden="true">
                  {service.tag}
                </span>
                <div className="lab-deploy-main">
                  <h3 className="lab-title">
                    <Link className="lab-deploy-link" to={`/services/${service.slug}`}>
                      {service.title}
                    </Link>
                  </h3>
                  <p className="lab-deploy-tagline lab-body">{service.tagline}</p>
                  {service.websiteUrl ? (
                    <p className="lab-deploy-ext">
                      <a
                        className="lab-link"
                        href={service.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit website<span aria-hidden="true"> ↗</span>
                      </a>
                    </p>
                  ) : null}
                </div>
                <ul className="lab-deploy-hl lab-data" role="list">
                  {service.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight}>
                      <span aria-hidden="true">— </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
                {outcome ? (
                  <dl className="lab-deploy-metric">
                    <dt className="lab-micro">{outcome.label}</dt>
                    <dd>{outcome.value}</dd>
                  </dl>
                ) : null}
                <span className="lab-deploy-act" aria-hidden="true">
                  <span className="lab-arrow">→</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="lab-more">
          <Link className="lab-link" to="/services">
            View all services
          </Link>{" "}
          <span className="lab-arrow" aria-hidden="true">
            →
          </span>
        </p>
      </div>
    </section>
  );
}
