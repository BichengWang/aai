import type { OpsNotifier } from "../../ports/index.js";

/**
 * Slack notifier that posts to an incoming webhook URL.
 *
 * Required env var: SLACK_WEBHOOK_URL
 *
 * When the env var is absent the factory returns a no-op notifier so that
 * the worker can still run without Slack credentials.
 */

function buildDigestBlocks(summary: string): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: summary.replace(/\n/g, "\n"),
      },
    },
  ];
}

async function postToSlack(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Slack webhook returned ${response.status}: ${text}`);
  }
}

export function createSlackNotifier(webhookUrl: string): OpsNotifier {
  return {
    async publishDigest({ summary }) {
      try {
        await postToSlack(webhookUrl, {
          blocks: buildDigestBlocks(summary),
        });
        return { accepted: true, externalId: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[slack-notifier] publishDigest failed:", message);
        return { accepted: false, externalId: null };
      }
    },

    async notifyApprovalRequested({ approvalRequestId, tripId }) {
      try {
        await postToSlack(webhookUrl, {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `:writing_hand: *Approval needed* for trip \`${tripId}\`\nRequest ID: \`${approvalRequestId}\``,
              },
            },
          ],
        });
        return { accepted: true, externalId: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          "[slack-notifier] notifyApprovalRequested failed:",
          message
        );
        return { accepted: false, externalId: null };
      }
    },

    async notifyIncidentDetected({ incidentId, tripId, type }) {
      try {
        const tripRef = tripId ? ` (trip \`${tripId}\`)` : "";
        await postToSlack(webhookUrl, {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `:warning: *Incident detected* — type: \`${type}\`${tripRef}\nIncident ID: \`${incidentId}\``,
              },
            },
          ],
        });
        return { accepted: true, externalId: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          "[slack-notifier] notifyIncidentDetected failed:",
          message
        );
        return { accepted: false, externalId: null };
      }
    },
  };
}

/**
 * Create a notifier from the SLACK_WEBHOOK_URL environment variable.
 * Returns a no-op notifier when the variable is not set.
 */
export function createEnvSlackNotifier(): OpsNotifier {
  const webhookUrl = process.env["SLACK_WEBHOOK_URL"];
  if (!webhookUrl) {
    return {
      async publishDigest() {
        return { accepted: false, externalId: null };
      },
      async notifyApprovalRequested() {
        return { accepted: false, externalId: null };
      },
      async notifyIncidentDetected() {
        return { accepted: false, externalId: null };
      },
    };
  }
  return createSlackNotifier(webhookUrl);
}
