import { useEnquiryForm } from "../lib/useEnquiryForm";
import { usePageTitle } from "../lib/usePageChrome";
import EnquiryFormStatus from "../components/EnquiryFormStatus";
import EnquiryHoneypot from "../components/EnquiryHoneypot";
import { Link } from "react-router-dom";
import LabPageHead from "../components/lab/LabPageHead";
import { services } from "../data/services";
import { useState } from "react";
import { useContactIdentity } from "../lib/useContactIdentity";

const commitments = [
  "Response within 24 hours",
  "Vetted providers only",
  "Privacy-first intake",
];

const requestOptions = [
  { label: "Find a provider", message: "Please help me find a local provider." },
  { label: "Check availability", message: "I would like to check service availability." },
  { label: "Ask about pricing", message: "I would like to know more about pricing." },
  { label: "Discuss a partnership", message: "I would like to discuss a provider partnership." },
];

export default function Enquiry() {
  usePageTitle(
    "Contact",
    "Tell the Altair team what you need, where and when. We reply within 24 hours with next steps or a matched local provider in the San Francisco Bay Area."
  );
  const { pending, sent, error, handleSubmit } = useEnquiryForm("enquiry");
  const identity = useContactIdentity();
  const [request, setRequest] = useState(requestOptions[0].message);
  const [customMessage, setCustomMessage] = useState("");

  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["Contact", "Intake form"]}
        title="Talk with the Altair team"
        lede="Share a few details and we will respond within 24 hours with next steps or a matched local provider."
      />

      <section className="lab-section" aria-label="Contact and enquiry form">
        <div className="container lab-grid lab-intake">
          <form
            className="lab-form lab-intake-form"
            onSubmit={handleSubmit}
            aria-busy={pending}
            aria-labelledby="lab-enquiry-title"
            aria-describedby="lab-enquiry-help"
          >
            <div className="lab-intake-form-head">
              <h2 className="lab-h3" id="lab-enquiry-title">Your enquiry</h2>
              <p className="lab-form-hint" id="lab-enquiry-help">Name and email are required.</p>
            </div>
            <fieldset className="form-fields" disabled={pending || sent}>
              <EnquiryHoneypot />
              <div className="lab-form-row">
                <label className="lab-field">
                  Name
                  <input className="lab-input" type="text" name="name" value={identity.name} onChange={(event) => identity.setName(event.target.value)} maxLength={120} autoComplete="name" required />
                </label>
                <label className="lab-field">
                  Email
                  <input className="lab-input" type="email" name="email" value={identity.email} onChange={(event) => identity.setEmail(event.target.value)} maxLength={254} autoComplete="email" required />
                </label>
              </div>
              <div className="lab-form-row">
                <label className="lab-field">
                  Service needed
                  <select className="lab-input lab-select" name="service" defaultValue="financial-planning" required>
                    <option value="general">General enquiry</option>
                    {services.map((service) => (
                      <option key={service.slug} value={service.slug}>
                        {service.title}
                      </option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="lab-field">
                  Timeline
                  <select className="lab-input lab-select" name="timeline" defaultValue="24-hours" required>
                    <option value="24-hours">Within 24 hours</option>
                    <option value="week">Within a week</option>
                    <option value="flexible">Flexible / not sure yet</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="lab-request-field">
                <label className="lab-field">
                  Tell us what you need
                  <select
                    className="lab-input lab-select"
                    name={request === "other" ? "request" : "message"}
                    value={request}
                    onChange={(event) => setRequest(event.target.value)}
                    aria-describedby="lab-request-help"
                    required
                  >
                    {requestOptions.map((option) => (
                      <option key={option.message} value={option.message}>{option.label}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </label>
                <p className="lab-form-hint" id="lab-request-help">
                  Choose Other to describe a specific request or a preferred provider.
                </p>
              </div>
              {request === "other" && (
                <label className="lab-field">
                  Your message
                  <textarea
                    className="lab-input lab-textarea"
                    name="message"
                    value={customMessage}
                    onChange={(event) => setCustomMessage(event.target.value)}
                    maxLength={5000}
                    placeholder="Tell us what you need..."
                    required
                  />
                </label>
              )}
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
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
