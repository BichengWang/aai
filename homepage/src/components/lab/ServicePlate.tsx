type ServicePlateProps = {
  id: string;
  tag: string;
  index: number;
  caption?: string;
};

/**
 * Drawn figure for a service line: the service monogram inside an orbit,
 * with a marker whose position differs per line. Replaces mismatched stock
 * thumbnails so every service reads as one figure set.
 */
export default function ServicePlate({ id, tag, index, caption }: ServicePlateProps) {
  const angle = (-50 + index * 72) * (Math.PI / 180);
  const point = (radius: number) => [160 + radius * Math.cos(angle), 100 + radius * Math.sin(angle)];
  const [rayX, rayY] = point(54);
  const [markerX, markerY] = point(84);

  return (
    <figure className="lab-plate">
      <div className="lab-figure-frame lab-plate-frame" aria-hidden="true">
        <span className="lab-figure-corner lab-figure-corner--tl">{`Fig. ${id}`}</span>
        <span className="lab-figure-corner lab-figure-corner--tr">{tag}</span>
        <svg className="lab-figure-svg" viewBox="0 0 320 200" focusable="false">
          <line className="lab-plate-axis" x1="0" y1="100" x2="320" y2="100" />
          <line className="lab-plate-axis" x1="160" y1="0" x2="160" y2="200" />
          <circle className="lab-plate-orbit" cx="160" cy="100" r="84" />
          <circle className="lab-plate-orbit lab-plate-orbit--inner" cx="160" cy="100" r="54" />
          <line className="lab-plate-ray" x1={rayX} y1={rayY} x2={markerX} y2={markerY} />
          <circle className="lab-plate-marker" cx={markerX} cy={markerY} r="4" />
          <text className="lab-plate-mono" x="160" y="100" textAnchor="middle" dominantBaseline="central">
            {tag}
          </text>
        </svg>
      </div>
      {caption ? <figcaption className="lab-figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}
