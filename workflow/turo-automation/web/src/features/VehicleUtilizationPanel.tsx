import type { VehicleUtilizationItem } from "@turo-automation/shared";
import { SectionCard } from "../ui/SectionCard";

function UtilizationBar(props: { rate: number }) {
  const pct = Math.round(props.rate * 100);
  return (
    <div className="util-bar-track" aria-label={`${pct}% utilization`}>
      <div className="util-bar-fill" style={{ width: `${pct}%` }} />
      <span className="util-bar-label">{pct}%</span>
    </div>
  );
}

export function VehicleUtilizationPanel(props: {
  items: VehicleUtilizationItem[];
  windowDays: number;
}) {
  const { items, windowDays } = props;

  return (
    <SectionCard
      title="Vehicle utilization"
      subtitle={`Last ${windowDays} days — booked days / calendar days`}
    >
      {items.map((item) => (
        <div className="list-row util-row" key={item.vehicleId}>
          <div>
            <strong>{item.vehicleNickname}</strong>
            <p>
              {item.totalTrips} trip{item.totalTrips !== 1 ? "s" : ""} ·{" "}
              {item.utilizationDays}d booked
            </p>
          </div>
          <div className="util-bar-wrap">
            <UtilizationBar rate={item.utilizationRate} />
          </div>
        </div>
      ))}
    </SectionCard>
  );
}
