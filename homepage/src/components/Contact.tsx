import { FormEvent, useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="section">
      <div className="container contact-grid">
        <div>
          <span className="pill">Contact</span>
          <h2 className="section-title">Start with a quick message</h2>
          <p className="section-subtitle">
            Tell us what you need and we will help you connect with trusted
            local providers.
          </p>
          <div className="contact-card">
            <div className="contact-item">
              <span className="contact-label">Location</span>
              <span>San Francisco Bay Area</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Email</span>
              <span>qx@altairworld.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Hours</span>
              <span>Mon-Fri, 9am-6pm PST</span>
            </div>
          </div>
        </div>
        <form className="contact-card" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              className="input"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email
            <input
              className="input"
              type="email"
              placeholder="name@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Send us what you need
            <textarea
              className="input textarea"
              placeholder="Tell us about the service you need..."
              required
            />
          </label>
          <button className="button" type="submit" disabled={sent}>
            {sent ? "Message sent" : "Send message"}
          </button>
          {sent ? (
            <p className="form-success" role="status" aria-live="polite">
              Thanks! We received your message and will follow up soon.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
