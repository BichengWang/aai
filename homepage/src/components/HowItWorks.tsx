import { steps } from "../data/homeContent";
import LabSectionHead from "./LabSectionHead";

export default function HowItWorks() {
  return (
    <section id="method" className="lab-section lab-section--band" aria-labelledby="lab-method-title">
      <div className="container">
        <LabSectionHead
          index="04"
          label="Method"
          titleId="lab-method-title"
          title="A guided path from request to match"
          intro="Three steps, the same for every service line: simple inputs, transparent progress and fast connections."
        />
        <div className="lab-steps-wrap">
          <span className="lab-steps-progress" aria-hidden="true" />
          <ol className="lab-steps" role="list">
            {steps.map((step, index) => (
              <li key={step.title} className="lab-step lab-reveal">
                <span className="lab-step-node" aria-hidden="true" />
                <p className="lab-micro">{`Step 0${index + 1} · ${step.phase}`}</p>
                <h3 className="lab-h3">{step.title}</h3>
                <p className="lab-body">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
