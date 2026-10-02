import { CSSProperties } from "react";

type Point = { x: number; y: number };

// Positions projected from J2000 coordinates onto a 400 × 440 plate
// (18 units per degree of declination; RA scaled by cos δ).
const stars = {
  alpha: { x: 131.3, y: 152.2, r: 4.6 },
  gamma: { x: 151.6, y: 120.8, r: 2.9 },
  beta: { x: 111.0, y: 196.5, r: 2.0 },
  delta: { x: 244.7, y: 255.7, r: 2.3 },
  zeta: { x: 334.7, y: 62.3, r: 2.7 },
  epsilon: { x: 360.7, y: 40.6, r: 1.8 },
  lambda: { x: 331.0, y: 399.7, r: 2.3 },
  eta: { x: 123.8, y: 293.7, r: 1.9 },
  theta: { x: 39.3, y: 326.6, r: 2.4 },
  iota: { x: 194.4, y: 335.0, r: 1.6 },
} as const;

type StarKey = keyof typeof stars;

const starOrder: ReadonlyArray<StarKey> = [
  "alpha",
  "gamma",
  "beta",
  "delta",
  "zeta",
  "epsilon",
  "lambda",
  "eta",
  "theta",
  "iota",
];

const constellationLines: ReadonlyArray<[StarKey, StarKey]> = [
  ["gamma", "alpha"],
  ["alpha", "beta"],
  ["beta", "eta"],
  ["eta", "theta"],
  ["alpha", "delta"],
  ["delta", "lambda"],
  ["delta", "zeta"],
  ["zeta", "epsilon"],
];

const declinations = [
  { y: 41.8, label: "+15°" },
  { y: 131.8, label: "+10°" },
  { y: 221.8, label: "+5°" },
  { y: 311.8, label: "0°" },
  { y: 401.8, label: "−5°" },
];

const rightAscensions = [
  { x: 90.0, label: "20h00m" },
  { x: 179.7, label: "19h40m" },
  { x: 269.3, label: "19h20m" },
  { x: 359.0, label: "19h00m" },
];

const order = (i: number) => ({ "--i": i }) as CSSProperties;

const linePath = (from: Point, to: Point) =>
  `M${from.x} ${from.y} L${to.x} ${to.y}`;

export default function AquilaFigure() {
  const altair = stars.alpha;

  return (
    <figure className="lab-figure" aria-hidden="true">
      <div className="lab-figure-frame">
        <span className="lab-figure-corner lab-figure-corner--tl">α Aql</span>
        <span className="lab-figure-corner lab-figure-corner--tr">Epoch J2000</span>
        <span className="lab-figure-corner lab-figure-corner--bl">RA 19h 50m 47s</span>
        <span className="lab-figure-corner lab-figure-corner--br">Dec +08° 52′ 06″</span>
        <svg className="lab-figure-svg" viewBox="0 0 400 440" focusable="false">
          <g className="lab-grat">
            {declinations.map((line) => (
              <g key={line.label}>
                <line x1={24} y1={line.y} x2={396} y2={line.y} />
                <text x={24} y={line.y - 5}>
                  {line.label}
                </text>
              </g>
            ))}
            {rightAscensions.map((line) => (
              <g key={line.label}>
                <line x1={line.x} y1={20} x2={line.x} y2={414} />
                <text x={line.x} y={432} textAnchor="middle">
                  {line.label}
                </text>
              </g>
            ))}
          </g>
          <g>
            {constellationLines.map(([from, to], index) => (
              <path
                key={`${from}-${to}`}
                className="lab-con-line"
                pathLength={1}
                d={linePath(stars[from], stars[to])}
                style={order(index)}
              />
            ))}
          </g>
          <circle className="lab-star-glow" cx={altair.x} cy={altair.y} r={16} />
          <circle className="lab-halo" cx={altair.x} cy={altair.y} r={11} />
          <circle className="lab-halo-pulse" cx={altair.x} cy={altair.y} r={11} />
          <g>
            {starOrder.map((key, index) => {
              const star = stars[key];
              return (
                <circle
                  key={key}
                  className={`lab-star${key === "alpha" ? " lab-star--alpha" : ""}`}
                  cx={star.x}
                  cy={star.y}
                  r={star.r}
                  style={order(index)}
                />
              );
            })}
          </g>
          <text className="lab-fig-label" x={113} y={148} textAnchor="end">
            α Altair
          </text>
          <text className="lab-fig-label lab-fig-label--minor" x={159} y={117}>
            γ
          </text>
          <text
            className="lab-fig-label lab-fig-label--minor"
            x={104}
            y={205}
            textAnchor="end"
          >
            β
          </text>
        </svg>
      </div>
      <figcaption className="lab-figure-caption">
        Fig. 1 — Altair (α Aquilae) in the constellation Aquila. Positions
        from J2000 coordinates; star sizes not to scale.
      </figcaption>
    </figure>
  );
}
