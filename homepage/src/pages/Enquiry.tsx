import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import LabPageHead from "../components/lab/LabPageHead";
import { services } from "../data/services";

const commitments = [
  "Response within 24 hours",
  "Vetted providers only",
  "Privacy-first intake",
];

export default function Enquiry() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["Enquiry", "Intake form"]}
        title="Tell us what you need"
        lede="Share a few details and we will match you with the right local provider."
      />

      <section className="lab-section" aria-label="Enquiry form">
        <div className="container lab-grid lab-intake">
          <aside className="lab-intake-aside">
            <ol className="lab-ruled lab-ruled--numbered" role="list">
              {commitments.map((item, index) => (
                <li key={item}>
                  <span className="lab-micro" aria-hidden="true">{`0${index + 1}`}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <div className="lab-intake-note">
              <h2 className="lab-h3">What happens next</h2>
              <p className="lab-body">
                We review your request, confirm availability, and send back a
                shortlist with clear next steps.
              </p>
              <p className="lab-body">
                If you have a preferred provider or timeline, add it to the form
                to speed up matching.
              </p>
            </div>
          </aside>
          <form className="lab-form lab-intake-form" onSubmit={handleSubmit}>
            <div className="lab-form-row">
              <label className="lab-field">
                Name
                <input className="lab-input" type="text" autoComplete="name" required />
              </label>
              <label className="lab-field">
                Email
                <input className="lab-input" type="email" autoComplete="email" required />
              </label>
            </div>
            <div className="lab-form-row">
              <label className="lab-field">
                Postcode
                <input className="lab-input" type="text" autoComplete="postal-code" required />
              </label>
              <label className="lab-field">
                Timeline
                <select className="lab-input lab-select" required>
                  <option value="">Choose a timeline</option>
                  <option value="24-hours">Within 24 hours</option>
                  <option value="week">Within a week</option>
                  <option value="flexible">Flexible</option>
                </select>
              </label>
            </div>
            <label className="lab-field">
              Service needed
              <select className="lab-input lab-select" required>
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.slug} value={service.slug}>
                    {service.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="lab-field">
              Tell us what you need
              <textarea
                className="lab-input lab-textarea"
                placeholder="Share a few details..."
                required
              />
            </label>
            <div className="lab-form-actions">
              <button className="lab-btn lab-btn--primary" type="submit">
                Submit enquiry
              </button>
              <Link className="lab-link" to="/services">
                Back to services
              </Link>
            </div>
            {sent ? (
              <p className="lab-form-status" role="status">
                Thanks! We received your enquiry and will follow up soon.
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
