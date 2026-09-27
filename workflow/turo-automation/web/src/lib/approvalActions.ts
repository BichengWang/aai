import {
  createActOnApprovalUseCase,
  createSupabaseMessageRepository,
  type ActOnApprovalData,
  type UseCaseResult,
} from "@turo-automation/shared";
import { getWebOperatorIdentity } from "./operatorIdentity";
import { createWebSupabaseClient } from "./supabaseClient";

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
  const client = createWebSupabaseClient();
  if (!client || !reviewedBy) return null;

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
