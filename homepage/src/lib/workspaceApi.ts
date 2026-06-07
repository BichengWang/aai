import type { Session } from "@supabase/supabase-js";
import { getConfiguredSupabasePublishableKey, getConfiguredSupabaseUrl, getAuthErrorMessage } from "./supabase";
import type {
  ChatCompletionResponse,
  ConversationMessagesResponse,
  ConversationRecord,
  WorkspaceKeyListResponse,
} from "../types/workspace";

const WORKSPACE_UNREACHABLE_MESSAGE =
  "Unable to reach the workspace service. Verify your Supabase URL and CORS settings, then try again.";
const WORKSPACE_NOT_DEPLOYED_MESSAGE =
  "The workspace service is not deployed for this Supabase project. Deploy the `workspace-api` Edge Function, then try again.";

function getWorkspaceApiBaseUrl() {
  const supabaseUrl = getConfiguredSupabaseUrl();

  if (!supabaseUrl) {
    throw new Error("Supabase is not configured.");
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/workspace-api`;
}

function getSupabasePublishableKey() {
  const supabasePublishableKey = getConfiguredSupabasePublishableKey();

  if (!supabasePublishableKey) {
    throw new Error("Supabase publishable key is not configured.");
  }

  return supabasePublishableKey;
}

async function parseWorkspaceResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
          ? payload.message
          : `Workspace request failed with ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

async function diagnoseWorkspaceConnectionFailure(baseUrl: string) {
  try {
    const response = await fetch(baseUrl, { method: "GET" });
    const payload = await response.json().catch(() => ({}));
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
          ? payload.message
          : "";

    if (response.status === 404 && /requested function was not found/i.test(message)) {
      return WORKSPACE_NOT_DEPLOYED_MESSAGE;
    }
  } catch {
    // Keep the generic message when the diagnostic probe cannot reach the service either.
  }

  return WORKSPACE_UNREACHABLE_MESSAGE;
}

async function workspaceRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    session?: Session | null;
  } = {}
) {
  const { method = "GET", body, session } = options;
  const headers = new Headers({
    apikey: getSupabasePublishableKey(),
  });

  if (body) {
    headers.set("Content-Type", "application/json");
  }

  const workspaceApiBaseUrl = getWorkspaceApiBaseUrl();

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${workspaceApiBaseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(await diagnoseWorkspaceConnectionFailure(workspaceApiBaseUrl));
    }

    throw error;
  }

  return parseWorkspaceResponse<T>(response);
}

export async function createWorkspaceHandoff(session: Session) {
  const payload = await workspaceRequest<{ token: string }>("/sso-handoff/create", {
    method: "POST",
    session,
    body: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    },
  });

  return payload.token;
}

export async function consumeWorkspaceHandoff(token: string) {
  return workspaceRequest<{ accessToken: string; refreshToken: string; expiresAt: string }>(
    "/sso-handoff/consume",
    {
      method: "POST",
      body: { token },
    }
  );
}

export async function listWorkspaceKeys(session: Session) {
  return workspaceRequest<WorkspaceKeyListResponse>("/credentials/list", { session });
}

export async function ensureManagedKey(session: Session) {
  return workspaceRequest<WorkspaceKeyListResponse>("/managed-key/bootstrap", {
    method: "POST",
    session,
  });
}

export async function createProviderCredential(
  session: Session,
  payload: {
    provider: "openai" | "anthropic" | "gemini";
    label: string;
    secret: string;
    monthlyTokenCap?: number | null;
  }
) {
  return workspaceRequest<WorkspaceKeyListResponse>("/credentials/create", {
    method: "POST",
    session,
    body: payload,
  });
}

export async function validateProviderCredential(session: Session, credentialId: string) {
  return workspaceRequest<WorkspaceKeyListResponse>("/credentials/validate", {
    method: "POST",
    session,
    body: { credentialId },
  });
}

export async function listConversations(session: Session) {
  return workspaceRequest<{ conversations: ConversationRecord[] }>("/conversations", { session });
}

export async function createConversation(session: Session, title?: string) {
  return workspaceRequest<{ conversation: ConversationRecord }>("/conversations", {
    method: "POST",
    session,
    body: { title },
  });
}

export async function listMessages(session: Session, conversationId: string) {
  return workspaceRequest<ConversationMessagesResponse>(
    `/messages?conversationId=${encodeURIComponent(conversationId)}`,
    { session }
  );
}

export async function completeWorkspaceChat(
  session: Session,
  payload: {
    conversationId?: string;
    content: string;
    routingMode: "auto" | "manual";
    provider?: "openai" | "anthropic" | "gemini";
    model?: string;
  }
) {
  return workspaceRequest<ChatCompletionResponse>("/chat/complete", {
    method: "POST",
    session,
    body: payload,
  });
}

export function getWorkspaceErrorMessage(error: unknown) {
  return getAuthErrorMessage(error);
}
