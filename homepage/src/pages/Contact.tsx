import { useEnquiryForm } from "../lib/useEnquiryForm";
import EnquiryFormStatus from "../components/EnquiryFormStatus";
import EnquiryHoneypot from "../components/EnquiryHoneypot";
import { Link } from "react-router-dom";
import LabPageHead from "../components/lab/LabPageHead";

const commitments = [
  "Response within 24 hours",
  "San Francisco Bay Area coverage",
  "Privacy-first intake",
];

export default function ContactPage() {
  const { pending, sent, error, handleSubmit } = useEnquiryForm("contact");

  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["Contact"]}
        title="Talk with the Altair team"
        lede="Share a quick note and we will respond with next steps within 24 hours."
      />

      <section className="lab-section" aria-label="Contact form">
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
              <label className="lab-field">
                Topic
                <select className="lab-input lab-select" name="topic" required>
                  <option value="">Select a topic</option>
                  <option value="services">Services enquiry</option>
                  <option value="partnerships">Provider partnership</option>
                  <option value="support">General support</option>
                </select>
              </label>
              <label className="lab-field">
                Message
                <textarea
                  className="lab-input lab-textarea"
                  name="message"
                  maxLength={5000}
                  placeholder="Tell us how we can help..."
                  required
                />
              </label>
              <div className="lab-form-actions">
                <button className="lab-btn lab-btn--primary" type="submit">
                  {pending ? "Sending..." : sent ? "Message sent" : "Send message"}
                </button>
                <Link className="lab-link" to="/services">
                  Back to services
                </Link>
              </div>
            </fieldset>
            <EnquiryFormStatus error={error} sent={sent} kind="message" />
          </form>
        </div>
      </section>
    </div>
  );
}
