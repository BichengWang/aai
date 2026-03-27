import {
  createActOnApprovalUseCase,
  createSupabaseMessageRepository,
  type ActOnApprovalData,
  type UseCaseResult,
} from "@turo-automation/shared";
import { createClient } from "@supabase/supabase-js";
import { getWebOperatorIdentity } from "./operatorIdentity";

const SUPABASE_URL = (import.meta as unknown as { env: Record<string, string> })
  .env["VITE_SUPABASE_URL"];
const SUPABASE_KEY = (import.meta as unknown as { env: Record<string, string> })
  .env["VITE_SUPABASE_KEY"];

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

// No-op notifier for web (Slack is worker-side only)
const noopNotifier = {
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

export async function actOnApproval(
  approvalRequestId: string,
  decision: "approved" | "rejected",
  reviewedBy: string | null = getWebOperatorIdentity()
): Promise<UseCaseResult<ActOnApprovalData> | null> {
  if (!useSupabase || !reviewedBy) return null;

  const client = createClient(SUPABASE_URL, SUPABASE_KEY);
  const messageRepository = createSupabaseMessageRepository(client);
  const useCase = createActOnApprovalUseCase({
    messageRepository,
    notifier: noopNotifier,
  });

  return useCase.execute({
    approvalRequestId,
    decision,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  });
}
