import { faqs } from "../data/homeContent";
import LabSectionHead from "./LabSectionHead";

export default function Faq() {
  return (
    <section id="faq" className="lab-section" aria-labelledby="lab-faq-title">
      <div className="container">
        <LabSectionHead
          index="07"
          label="FAQ"
          titleId="lab-faq-title"
          title="Questions, answered"
          intro="Short answers to what people ask first. Anything else — send us a message below."
        />
        <div className="lab-grid">
          <div className="lab-faq lab-offset lab-reveal">
            {faqs.map((item, index) => (
              <details key={item.question} className="lab-faq-item">
                <summary>
                  <span className="lab-faq-num lab-micro" aria-hidden="true">
                    {`Q${index + 1}`}
                  </span>
                  <span className="lab-faq-q">{item.question}</span>
                  <span className="lab-faq-icon" aria-hidden="true" />
                </summary>
                <p className="lab-faq-a">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
