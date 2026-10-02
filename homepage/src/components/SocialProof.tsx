import { quotes, stats } from "../data/homeContent";
import LabSectionHead from "./LabSectionHead";

export default function SocialProof() {
  return (
    <section id="field-notes" className="lab-section" aria-labelledby="lab-field-notes-title">
      <div className="container">
        <LabSectionHead
          index="06"
          label="Field notes"
          titleId="lab-field-notes-title"
          title="What clients tell us"
          intro="Clear communication, vetted providers, and a process that respects your time."
        />
        <div className="lab-grid">
          <div className="lab-offset">
            <p className="lab-statline">
              <span>
                <span className="lab-micro">Client satisfaction</span>{" "}
                <span className="lab-data">{stats.clientSatisfaction}</span>
              </span>
              <span>
                <span className="lab-micro">Response rate</span>{" "}
                <span className="lab-data">{stats.responseRate}</span>
              </span>
            </p>
          </div>
        </div>
        <ul className="lab-quotes" role="list">
          {quotes.map((item) => (
            <li key={item.quote}>
              <figure className="lab-quote lab-reveal">
                <blockquote>
                  <p>{`“${item.quote}”`}</p>
                </blockquote>
                <figcaption>
                  <cite className="lab-micro">— {item.name}</cite>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
