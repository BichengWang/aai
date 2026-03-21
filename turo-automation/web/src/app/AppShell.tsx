import { appName, type UseCaseIssue, type VehicleUtilizationItem } from "@turo-automation/shared";
import { useEffect, useState } from "react";
import type { TodayOpsSnapshot } from "@turo-automation/shared";
import { OpsDashboard } from "../features/OpsDashboard";
import { VehicleUtilizationPanel } from "../features/VehicleUtilizationPanel";
import { loadSnapshot } from "../lib/loadSnapshot";
import { loadVehicleUtilization } from "../lib/loadVehicleUtilization";

type LoadState = "idle" | "loading" | "ready" | "failed";

export function AppShell() {
  const [snapshot, setSnapshot] = useState<TodayOpsSnapshot | null>(null);
  const [issues, setIssues] = useState<UseCaseIssue[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [utilizationItems, setUtilizationItems] = useState<VehicleUtilizationItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoadState("loading");

      try {
        const [snapshotResult, utilizationResult] = await Promise.all([
          loadSnapshot(),
          loadVehicleUtilization(30),
        ]);
        if (!isMounted) return;
        setSnapshot(snapshotResult.data);
        setIssues(snapshotResult.issues);
        setUtilizationItems(utilizationResult.data.items);
        setLoadState("ready");
      } catch {
        if (!isMounted) return;
        setLoadState("failed");
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const isSupabaseBacked = Boolean(
    (import.meta as unknown as { env: Record<string, string> }).env[
      "VITE_SUPABASE_URL"
    ]
  );

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="masthead">
          <div>
            <p className="eyebrow">
              {isSupabaseBacked ? "Supabase-backed" : "Fixture-backed"}
            </p>
            <h1>{appName}</h1>
            <p className="lead">
              Host ops dashboard — reads from{" "}
              {isSupabaseBacked
                ? "real Supabase persistence"
                : "fixture data (no VITE_SUPABASE_URL set)"}
              .
            </p>
          </div>

          <div className="status-panel">
            <span className={`status-badge status-${loadState}`}>
              {loadState}
            </span>
          </div>
        </header>

        {loadState === "failed" ? (
          <section className="failure-panel">
            <h2>Snapshot unavailable</h2>
            <p>
              Failed to load the ops snapshot. Check your connection and
              credentials.
            </p>
          </section>
        ) : null}

        {snapshot ? (
          <>
            <OpsDashboard snapshot={snapshot} issues={issues} />
            {utilizationItems.length > 0 && (
              <VehicleUtilizationPanel items={utilizationItems} windowDays={30} />
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
