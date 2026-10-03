import { useEnquiryForm } from "../lib/useEnquiryForm";
import EnquiryFormStatus from "../components/EnquiryFormStatus";
import EnquiryHoneypot from "../components/EnquiryHoneypot";
import LabSectionHead from "./LabSectionHead";

export default function Contact() {
  const { pending, sent, error, handleSubmit } = useEnquiryForm("contact");

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
          <form className="lab-form" onSubmit={handleSubmit} aria-busy={pending}>
            <fieldset className="form-fields" disabled={pending || sent}>
              <EnquiryHoneypot />
              <label className="lab-field">
                Name
                <input
                  className="lab-input"
                  type="text"
                  name="name"
                  maxLength={120}
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
                  name="email"
                  maxLength={254}
                  placeholder="name@email.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="lab-field">
                Send us what you need
                <textarea
                  className="lab-input lab-textarea"
                  name="message"
                  maxLength={5000}
                  placeholder="Tell us about the service you need..."
                  required
                />
              </label>
              <button className="lab-btn lab-btn--primary" type="submit">
                {pending ? "Sending..." : sent ? "Message sent" : "Send message"}
              </button>
            </fieldset>
            <EnquiryFormStatus error={error} sent={sent} kind="message" />
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
