import { Fragment, ReactNode } from "react";

type LabPageHeadProps = {
  kicker: string[];
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
};

/** Night-plate page header shared by inner routes (one h1 per page). */
export default function LabPageHead({ kicker, title, lede, actions, aside }: LabPageHeadProps) {
  return (
    <header className={`lab-pagehead lab-night${aside ? " lab-pagehead--aside" : ""}`}>
      <div className="lab-pagehead-field" aria-hidden="true" />
      <div className="container lab-grid lab-pagehead-grid">
        <p className="lab-kicker lab-micro lab-pagehead-kicker">
          {kicker.map((part, index) => (
            <Fragment key={part}>
              {index > 0 ? (
                <span className="lab-kicker-sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              <span>{part}</span>
            </Fragment>
          ))}
        </p>
        <div className="lab-pagehead-main">
          <h1 className="lab-h1">{title}</h1>
          {lede ? <p className="lab-lede">{lede}</p> : null}
          {actions ? <div className="lab-pagehead-actions">{actions}</div> : null}
        </div>
        {aside ? <div className="lab-pagehead-aside">{aside}</div> : null}
      </div>
    </header>
  );
}
