import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import LabPageHead from "../components/lab/LabPageHead";

const commitments = [
  "Response within 24 hours",
  "San Francisco Bay Area coverage",
  "Privacy-first intake",
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

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
            <label className="lab-field">
              Topic
              <select className="lab-input lab-select" required>
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
                placeholder="Tell us how we can help..."
                required
              />
            </label>
            <div className="lab-form-actions">
              <button className="lab-btn lab-btn--primary" type="submit">
                Send message
              </button>
              <Link className="lab-link" to="/services">
                Back to services
              </Link>
            </div>
            {sent ? (
              <p className="lab-form-status" role="status">
                Thanks! We received your message and will follow up soon.
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
