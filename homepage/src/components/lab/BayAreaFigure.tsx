import { coverageCities } from "../../data/homeContent";

type Point = { x: number; y: number };

// Equirectangular projection of the Bay Area onto a 270 × 320 plate.
const projectX = (lon: number) => 40 + (lon + 122.47) * 301.8;
const projectY = (lat: number) => 40 + (37.92 - lat) * 380.95;
const round = (value: number) => Math.round(value * 10) / 10;

const latitudes = [37.8, 37.6, 37.4];
const longitudes = [-122.4, -122.2, -122.0];

const cityPoints: ReadonlyArray<Point & { name: string }> = coverageCities.map(
  (city) => ({
    name: city.name,
    x: round(projectX(city.lon)),
    y: round(projectY(city.lat)),
  })
);

// Convex hull (monotone chain) of the plotted cities.
function hull(points: ReadonlyArray<Point>): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const build = (input: Point[]) => {
    const chain: Point[] = [];
    for (const point of input) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0
      ) {
        chain.pop();
      }
      chain.push(point);
    }
    chain.pop();
    return chain;
  };
  return [...build(sorted), ...build([...sorted].reverse())];
}

const hullPoints = hull(cityPoints)
  .map((point) => `${point.x},${point.y}`)
  .join(" ");

export default function BayAreaFigure() {
  return (
    <figure className="lab-figure lab-reveal" aria-hidden="true">
      <div className="lab-figure-frame">
        <span className="lab-figure-corner lab-figure-corner--tl">Fig. 2</span>
        <span className="lab-figure-corner lab-figure-corner--tr">
          {`${cityPoints.length} cities live`}
        </span>
        <svg className="lab-figure-svg" viewBox="0 0 270 320" focusable="false">
          <g className="lab-grat">
            {latitudes.map((lat) => {
              const y = round(projectY(lat));
              return (
                <g key={lat}>
                  <line x1={16} y1={y} x2={262} y2={y} />
                  <text x={262} y={y - 5} textAnchor="end">
                    {`${lat.toFixed(1)}° N`}
                  </text>
                </g>
              );
            })}
            {longitudes.map((lon) => {
              const x = round(projectX(lon));
              return (
                <g key={lon}>
                  <line x1={x} y1={16} x2={x} y2={296} />
                  <text x={x} y={312} textAnchor="middle">
                    {`${Math.abs(lon).toFixed(1)}° W`}
                  </text>
                </g>
              );
            })}
          </g>
          <polygon className="lab-hull" points={hullPoints} />
          {cityPoints.map((city, index) => (
            <g key={city.name}>
              <circle className="lab-city-point" cx={city.x} cy={city.y} r={3.5} />
              {/* San Francisco sits on the western edge; label it outside the outline. */}
              <text
                className="lab-fig-label lab-fig-label--minor"
                x={index === 0 ? city.x - 7 : city.x + 7}
                y={city.y - 6}
                textAnchor={index === 0 ? "end" : undefined}
              >
                {String(index + 1).padStart(2, "0")}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="lab-figure-caption">
        Fig. 2 — Live cities plotted by latitude and longitude. The dashed
        outline joins the outermost cities; it is not a service boundary.
      </figcaption>
    </figure>
  );
}
