import { Link, useParams } from "react-router-dom";
import { linkTargetProps } from "../lib/links";
import { usePageTitle } from "../lib/usePageChrome";
import LabSectionHead from "../components/LabSectionHead";
import LabPageHead from "../components/lab/LabPageHead";
import ServicePlate from "../components/lab/ServicePlate";
import { services } from "../data/services";

const arrow = (
  <span className="lab-btn-arrow" aria-hidden="true">
    →
  </span>
);

export default function ServiceDetail() {
  const { slug } = useParams();
  const index = services.findIndex((item) => item.slug === slug);
  const service = services[index];
  usePageTitle(service ? service.title : "Service not found", service?.description);

  if (!service) {
    return (
      <div className="lab-page">
        <LabPageHead
          kicker={["Services", "Not found"]}
          title="Service not found"
          lede="The service you are looking for is not available yet."
          actions={
            <Link className="lab-btn lab-btn--primary" to="/services">
              Back to services
            </Link>
          }
        />
      </div>
    );
  }

  const id = `D-0${index + 1}`;

  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["Services", `${id} · ${service.tag}`]}
        title={service.title}
        lede={service.description}
        actions={
          <>
            <Link className="lab-btn lab-btn--primary" to="/enquiry">
              Start an enquiry
              {arrow}
            </Link>
            <Link className="lab-btn lab-btn--ghost" to="/services">
              Back to services
            </Link>
            {service.websiteUrl ? (
              <a
                className="lab-btn lab-btn--ghost"
                href={service.websiteUrl}
                {...linkTargetProps(service.websiteUrl)}
              >
                {service.websiteLabel ?? "Visit website"}
              </a>
            ) : null}
          </>
        }
        aside={
          <ServicePlate
            id={id}
            tag={service.tag}
            index={index}
            caption={`Fig. ${id} — ${service.tagline}`}
          />
        }
      />

      <section className="lab-section lab-section--tight" aria-label="Outcomes">
        <div className="container">
          <dl className="lab-stats">
            {service.outcomes.map((metric) => (
              <div key={metric.label} className="lab-stat">
                <dt className="lab-micro">{metric.label}</dt>
                <dd className="lab-metric-value">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="lab-section" aria-labelledby="svc-scope-title">
        <div className="container">
          <LabSectionHead
            index="01"
            label="Scope"
            titleId="svc-scope-title"
            title="Who this is for, and what you receive"
          />
          <div className="lab-grid">
            <div className="lab-offset lab-columns">
              <div className="lab-reveal">
                <h3 className="lab-micro lab-list-title">Suited for</h3>
                <ul className="lab-ruled" role="list">
                  {service.suitedFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="lab-reveal">
                <h3 className="lab-micro lab-list-title">Deliverables</h3>
                <ul className="lab-ruled" role="list">
                  {service.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="lab-reveal">
                <h3 className="lab-micro lab-list-title">Highlights</h3>
                <ul className="lab-ruled" role="list">
                  {service.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lab-section lab-section--band" aria-labelledby="svc-process-title">
        <div className="container">
          <LabSectionHead
            index="02"
            label="Process"
            titleId="svc-process-title"
            title="A clear intake timeline"
            intro="Every request includes transparent steps and status updates."
          />
          <div className="lab-steps-wrap">
            <span className="lab-steps-progress" aria-hidden="true" />
            <ol className="lab-steps" role="list">
              {service.timeline.map((step, stepIndex) => (
                <li key={step.title} className="lab-step lab-reveal">
                  <span className="lab-step-node" aria-hidden="true" />
                  <p className="lab-micro">{`Step 0${stepIndex + 1}`}</p>
                  <h3 className="lab-h3">{step.title}</h3>
                  <p className="lab-body">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="lab-section" aria-labelledby="svc-compliance-title">
        <div className="container">
          <LabSectionHead
            index="03"
            label="Compliance"
            titleId="svc-compliance-title"
            title="Compliance and care built in"
            intro="We keep intake aligned with regulatory requirements and protect your information at every step."
          />
          <div className="lab-grid">
            <ol className="lab-ruled lab-ruled--numbered lab-offset lab-reveal" role="list">
              {service.compliance.map((item, itemIndex) => (
                <li key={item}>
                  <span className="lab-micro" aria-hidden="true">
                    {`C-0${itemIndex + 1}`}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="lab-section" aria-labelledby="svc-faq-title">
        <div className="container">
          <LabSectionHead index="04" label="FAQ" titleId="svc-faq-title" title="Service questions" />
          <div className="lab-grid">
            <div className="lab-faq lab-offset lab-reveal">
              {service.faqs.map((item, faqIndex) => (
                <details key={item.question} className="lab-faq-item">
                  <summary>
                    <span className="lab-faq-num lab-micro" aria-hidden="true">
                      {`Q${faqIndex + 1}`}
                    </span>
                    <span className="lab-faq-q">{item.question}</span>
                    <span className="lab-faq-icon" aria-hidden="true" />
                  </summary>
                  <p className="lab-faq-a">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lab-section lab-section--band" aria-labelledby="svc-cta-title">
        <div className="container lab-grid lab-cta">
          <p className="lab-label">Next step</p>
          <div className="lab-cta-main">
            <h2 id="svc-cta-title" className="lab-h2">
              Ready when you are.
            </h2>
            <p className="lab-intro">
              Share your timeline and location; we confirm availability and send
              clear next steps.
            </p>
            <div className="lab-pagehead-actions">
              <Link className="lab-btn lab-btn--primary" to="/enquiry">
                Start an enquiry
                {arrow}
              </Link>
              <Link className="lab-link" to="/services">
                See all services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
