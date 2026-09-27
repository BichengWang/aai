import type { TripTimelineEntry } from "@turo-automation/shared";
import { formatCompactDateTime } from "../lib/format";

const KIND_LABELS: Record<TripTimelineEntry["kind"], string> = {
  trip_event: "event",
  task: "task",
  incident: "incident",
  draft: "draft",
};

export function TripTimelinePanel(props: {
  tripId: string;
  entries: TripTimelineEntry[];
  onClose: () => void;
}) {
  const { tripId, entries, onClose } = props;

  return (
    <aside className="timeline-panel">
      <div className="timeline-header">
        <div>
          <p className="eyebrow">Trip timeline</p>
          <h2>{tripId}</h2>
        </div>
        <button className="btn-close" onClick={onClose} aria-label="Close timeline">
          ✕
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="timeline-empty">No timeline entries for this trip.</p>
      ) : (
        <ol className="timeline-list">
          {entries.map((entry) => (
            <li key={entry.id} className={`timeline-entry timeline-${entry.kind}`}>
              <span className="timeline-timestamp">
                {formatCompactDateTime(entry.timestamp)}
              </span>
              <div className="timeline-body">
                <span className={`pill pill-${entry.kind}`}>
                  {KIND_LABELS[entry.kind]}
                </span>
                <strong>{entry.label}</strong>
                {entry.detail && <span className="timeline-detail">{entry.detail}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
