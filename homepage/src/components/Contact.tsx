import { FormEvent, useState } from "react";
import LabSectionHead from "./LabSectionHead";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="lab-section lab-contact" aria-labelledby="lab-contact-title">
      <div className="container">
        <LabSectionHead
          index="08"
          label="Contact"
          titleId="lab-contact-title"
          title="Start with a quick message"
          intro="Tell us what you need and we will help you connect with trusted local providers."
        />
        <div className="lab-grid lab-contact-grid">
          <form className="lab-form" onSubmit={handleSubmit}>
            <label className="lab-field">
              Name
              <input
                className="lab-input"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </label>
            <label className="lab-field">
              Email
              <input
                className="lab-input"
                type="email"
                placeholder="name@email.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="lab-field">
              Send us what you need
              <textarea
                className="lab-input lab-textarea"
                placeholder="Tell us about the service you need..."
                required
              />
            </label>
            <button className="lab-btn lab-btn--primary" type="submit" disabled={sent}>
              {sent ? "Message sent" : "Send message"}
            </button>
            {sent ? (
              <p className="lab-form-status" role="status" aria-live="polite">
                <span className="lab-dot" aria-hidden="true" />
                Thanks! We received your message and will follow up soon.
              </p>
            ) : null}
          </form>
          <dl className="lab-contact-details">
            <div>
              <dt className="lab-micro">Location</dt>
              <dd>San Francisco Bay Area</dd>
            </div>
            <div>
              <dt className="lab-micro">Email</dt>
              <dd>qx@altairworld.com</dd>
            </div>
            <div>
              <dt className="lab-micro">Hours</dt>
              <dd>Mon-Fri, 9am-6pm PST</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
