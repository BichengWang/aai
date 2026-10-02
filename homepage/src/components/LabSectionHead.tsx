type LabSectionHeadProps = {
  index: string;
  label: string;
  titleId: string;
  title: string;
  intro?: string;
};

export default function LabSectionHead({
  index,
  label,
  titleId,
  title,
  intro,
}: LabSectionHeadProps) {
  return (
    <div className="lab-head lab-grid lab-reveal">
      <p className="lab-label">
        <span className="lab-label-index">{index}</span>{" "}
        <span className="lab-label-rule" aria-hidden="true" />
        {label}
      </p>
      <div className="lab-head-main">
        <h2 id={titleId} className="lab-h2">
          {title}
        </h2>
        {intro ? <p className="lab-intro">{intro}</p> : null}
      </div>
    </div>
  );
}
