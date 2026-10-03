import { useEnquiryForm } from "../lib/useEnquiryForm";
import EnquiryFormStatus from "../components/EnquiryFormStatus";
import EnquiryHoneypot from "../components/EnquiryHoneypot";
import { Link } from "react-router-dom";
import LabPageHead from "../components/lab/LabPageHead";
import { services } from "../data/services";

const commitments = [
  "Response within 24 hours",
  "Vetted providers only",
  "Privacy-first intake",
];

export default function Enquiry() {
  const { pending, sent, error, handleSubmit } = useEnquiryForm("enquiry");

  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["Contact", "Intake form"]}
        title="Talk with the Altair team"
        lede="Share a few details and we will respond within 24 hours with next steps or a matched local provider."
      />

      <section className="lab-section" aria-label="Contact and enquiry form">
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
              <h2 className="lab-h3">Contact details</h2>
              <dl className="lab-contact-details">
                <div>
                  <dt className="lab-micro">Location</dt>
                  <dd>San Francisco Bay Area</dd>
                </div>
                <div>
                  <dt className="lab-micro">Email</dt>
                  <dd>
                    <a className="lab-link" href="mailto:qx@altairworld.com">
                      qx@altairworld.com
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="lab-micro">Hours</dt>
                  <dd>Mon-Fri, 9am-6pm PST</dd>
                </div>
              </dl>
            </div>
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
          <form className="lab-form lab-intake-form" onSubmit={handleSubmit} aria-busy={pending}>
            <fieldset className="form-fields" disabled={pending || sent}>
              <EnquiryHoneypot />
              <div className="lab-form-row">
                <label className="lab-field">
                  Name
                  <input className="lab-input" type="text" name="name" maxLength={120} autoComplete="name" required />
                </label>
                <label className="lab-field">
                  Email
                  <input className="lab-input" type="email" name="email" maxLength={254} autoComplete="email" required />
                </label>
              </div>
              <div className="lab-form-row">
                <label className="lab-field">
                  Postcode
                  <input className="lab-input" type="text" name="postcode" maxLength={20} autoComplete="postal-code" required />
                </label>
                <label className="lab-field">
                  Timeline
                  <select className="lab-input lab-select" name="timeline" required>
                    <option value="">Choose a timeline</option>
                    <option value="24-hours">Within 24 hours</option>
                    <option value="week">Within a week</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </label>
              </div>
              <label className="lab-field">
                Service needed
                <select className="lab-input lab-select" name="service" required>
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.title}
                    </option>
                  ))}
                  <option value="general">General question or provider partnership</option>
                </select>
              </label>
              <label className="lab-field">
                Tell us what you need
                <textarea
                  className="lab-input lab-textarea"
                  name="message"
                  maxLength={5000}
                  placeholder="Share a few details..."
                  required
                />
              </label>
              <div className="lab-form-actions">
                <button className="lab-btn lab-btn--primary" type="submit">
                  {pending ? "Sending..." : sent ? "Enquiry sent" : "Submit enquiry"}
                </button>
                <Link className="lab-link" to="/services">
                  Back to services
                </Link>
              </div>
            </fieldset>
            <EnquiryFormStatus error={error} sent={sent} kind="enquiry" />
          </form>
        </div>
      </section>
    </div>
  );
}
