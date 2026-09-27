import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ApprovalRequest,
  MessageDraft,
  MessageThread,
} from "../../domain/index.js";
import type { MessageRepository } from "../../ports/index.js";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------
interface MessageThreadRow {
  id: string;
  trip_id: string;
  guest_id: string;
  channel: string;
  status: string;
  last_message_at: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageDraftRow {
  id: string;
  thread_id: string;
  trip_id: string;
  direction: string;
  channel: string;
  body: string;
  template_key: string;
  approval_status: string;
  state: string;
  requested_by: string;
  created_at: string;
  updated_at: string;
}

interface ApprovalRequestRow {
  id: string;
  draft_id: string;
  trip_id: string;
  status: string;
  requested_by: string;
  reviewed_by: string | null;
  requested_at: string;
  reviewed_at: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function rowToThread(r: MessageThreadRow): MessageThread {
  return {
    id: r.id,
    tripId: r.trip_id,
    guestId: r.guest_id,
    channel: r.channel as MessageThread["channel"],
    status: r.status as MessageThread["status"],
    lastMessageAt: r.last_message_at,
    ownerId: r.owner_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function threadToRow(
  t: MessageThread
): Omit<MessageThreadRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: t.id,
    trip_id: t.tripId,
    guest_id: t.guestId,
    channel: t.channel,
    status: t.status,
    last_message_at: t.lastMessageAt,
    owner_id: t.ownerId,
  };
}

function rowToDraft(r: MessageDraftRow): MessageDraft {
  return {
    id: r.id,
    threadId: r.thread_id,
    tripId: r.trip_id,
    direction: r.direction as MessageDraft["direction"],
    channel: r.channel as MessageDraft["channel"],
    body: r.body,
    templateKey: r.template_key,
    approvalStatus: r.approval_status as MessageDraft["approvalStatus"],
    state: r.state as MessageDraft["state"],
    requestedBy: r.requested_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function draftToRow(
  d: MessageDraft
): Omit<MessageDraftRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: d.id,
    thread_id: d.threadId,
    trip_id: d.tripId,
    direction: d.direction,
    channel: d.channel,
    body: d.body,
    template_key: d.templateKey,
    approval_status: d.approvalStatus,
    state: d.state,
    requested_by: d.requestedBy,
  };
}

function rowToApproval(r: ApprovalRequestRow): ApprovalRequest {
  return {
    id: r.id,
    draftId: r.draft_id,
    tripId: r.trip_id,
    status: r.status as ApprovalRequest["status"],
    requestedBy: r.requested_by,
    reviewedBy: r.reviewed_by,
    requestedAt: r.requested_at,
    reviewedAt: r.reviewed_at,
    notes: r.notes,
  };
}

function approvalToRow(
  a: ApprovalRequest
): ApprovalRequestRow {
  return {
    id: a.id,
    draft_id: a.draftId,
    trip_id: a.tripId,
    status: a.status,
    requested_by: a.requestedBy,
    reviewed_by: a.reviewedBy,
    requested_at: a.requestedAt,
    reviewed_at: a.reviewedAt,
    notes: a.notes,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createSupabaseMessageRepository(
  client: SupabaseClient
): MessageRepository {
  return {
    async listThreads() {
      const { data, error } = await client
        .from("message_threads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`listThreads: ${error.message}`);
      return (data as MessageThreadRow[]).map(rowToThread);
    },

    async saveThreads(threads) {
      if (threads.length === 0) return [];
      const rows = threads.map(threadToRow);
      const { data, error } = await client
        .from("message_threads")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveThreads: ${error.message}`);
      return (data as MessageThreadRow[]).map(rowToThread);
    },

    async listDrafts() {
      const { data, error } = await client
        .from("message_drafts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`listDrafts: ${error.message}`);
      return (data as MessageDraftRow[]).map(rowToDraft);
    },

    async saveDrafts(drafts) {
      if (drafts.length === 0) return [];
      const rows = drafts.map(draftToRow);
      const { data, error } = await client
        .from("message_drafts")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveDrafts: ${error.message}`);
      return (data as MessageDraftRow[]).map(rowToDraft);
    },

    async listApprovalRequests() {
      const { data, error } = await client
        .from("approval_requests")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw new Error(`listApprovalRequests: ${error.message}`);
      return (data as ApprovalRequestRow[]).map(rowToApproval);
    },

    async saveApprovalRequests(approvalRequests) {
      if (approvalRequests.length === 0) return [];
      const rows = approvalRequests.map(approvalToRow);
      const { data, error } = await client
        .from("approval_requests")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveApprovalRequests: ${error.message}`);
      return (data as ApprovalRequestRow[]).map(rowToApproval);
    },
  };
}
