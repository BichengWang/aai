import { approach } from "../data/homeContent";
import LabSectionHead from "./LabSectionHead";

export default function Approach() {
  return (
    <section id="approach" className="lab-section" aria-labelledby="lab-approach-title">
      <div className="container">
        <LabSectionHead
          index="01"
          label="Approach"
          titleId="lab-approach-title"
          title="Research, systems, deployment — in that order."
        />
        <div className="lab-grid">
          <p className="lab-statement lab-offset lab-reveal">
            Tell us what you need, where and when. Our systems guide the
            intake, check availability and licensing, and hand it to a vetted
            local provider — with clear updates at every step.
          </p>
        </div>
        <ol className="lab-triad" role="list">
          {approach.map((item) => (
            <li key={item.tag} className="lab-triad-item lab-reveal">
              <p className="lab-micro">{item.tag}</p>
              <h3 className="lab-h3">{item.title}</h3>
              <p className="lab-body">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
