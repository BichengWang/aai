import { Link } from "react-router-dom";
import { systems } from "../data/homeContent";
import LabSectionHead from "./LabSectionHead";
import OpenWorkspaceButton from "./OpenWorkspaceButton";

// Keep each "·" separator attached to the item before it so wrapped lines
// never start with a separator.
const keepSeparators = (value: string) => value.replace(/ · /g, "\u00a0· ");

export default function Systems() {
  return (
    <section id="systems" className="lab-section" aria-labelledby="lab-systems-title">
      <div className="container">
        <LabSectionHead
          index="02"
          label="Systems"
          titleId="lab-systems-title"
          title="What we build"
          intro="A short index of the systems we run today."
        />
        <div className="lab-index-head lab-micro" aria-hidden="true">
          <span>ID</span>
          <span>System</span>
          <span>Function</span>
          <span>Status</span>
          <span />
        </div>
        <ol className="lab-index" role="list">
          {systems.map((system) => (
            <li key={system.id} className="lab-index-row lab-reveal">
              <p className="lab-index-id lab-micro">{system.id}</p>
              <div className="lab-index-main">
                <h3 className="lab-title">{system.title}</h3>
                <p className="lab-body">{system.description}</p>
              </div>
              <p className="lab-index-fn lab-data">
                <span className="lab-sr">Function: </span>
                {keepSeparators(system.functions)}
              </p>
              <p className="lab-index-status lab-data">
                <span className="lab-sr">Status: </span>
                <span className="lab-dot" aria-hidden="true" />
                {keepSeparators(system.status)}
              </p>
              <div className="lab-index-action">
                {system.href ? (
                  <Link className="lab-link" to={system.href}>
                    {system.cta}
                  </Link>
                ) : (
                  <OpenWorkspaceButton
                    className="lab-link lab-link--button"
                    label={system.cta}
                  />
                )}
                <span className="lab-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
