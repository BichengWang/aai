import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type ProviderName = "openai" | "anthropic" | "gemini";
type CredentialStatus = "pending" | "valid" | "invalid" | "error";
type RoutingMode = "auto" | "manual";
type TaskCategory = "coding" | "analysis" | "creative" | "general";

type ProviderCredentialRow = {
  id: string;
  user_id: string;
  provider: ProviderName;
  label: string;
  encrypted_secret: string;
  secret_mask: string;
  status: CredentialStatus;
  validation_error: string | null;
  last_validated_at: string | null;
  monthly_token_cap: number | null;
  created_at: string;
  updated_at: string;
};

type PublicProviderCredentialRow = Omit<ProviderCredentialRow, "encrypted_secret">;

const publicCredentialColumns =
  "id, user_id, provider, label, secret_mask, status, validation_error, last_validated_at, monthly_token_cap, created_at, updated_at";

type ManagedApiKeyRow = {
  id: string;
  user_id: string;
  key_name: string;
  secret_hash: string;
  secret_preview: string | null;
  status: "active" | "disabled";
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  provider: ProviderName | null;
  model: string | null;
  routing_mode: RoutingMode;
  created_at: string;
};

type UsageEventRow = {
  id: string;
  user_id: string;
  credential_id: string | null;
  conversation_id: string | null;
  provider: ProviderName;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number | null;
  created_at: string;
};

const allowedOrigins = new Set(
  (Deno.env.get("WORKSPACE_ALLOWED_ORIGINS")?.trim() ||
    "https://altairworld.com,https://llm.altairworld.com,http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

function getCorsHeaders(request: Request) {
  const headers: Record<string, string> = { Vary: "Origin" };
  const origin = request.headers.get("Origin");

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, x-client-info, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
  }

  return headers;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabasePublishableKey =
  Deno.env.get("SB_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const encryptionSecret = Deno.env.get("WORKSPACE_ENCRYPTION_SECRET");

if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey || !encryptionSecret) {
  throw new Error(
    "Missing required Supabase or workspace secrets. Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, and WORKSPACE_ENCRYPTION_SECRET."
  );
}

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

function getUserClient(authHeader: string) {
  return createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    throw new Response(JSON.stringify({ error: "Missing Authorization header." }), {
      status: 401,
      headers: { ...getCorsHeaders(request), "Content-Type": "application/json" },
    });
  }

  // Handoff consumption has no JWT; all other routes authenticate with getUser.
  const userClient = getUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Your workspace session is invalid or expired." }), {
      status: 401,
      headers: { ...getCorsHeaders(request), "Content-Type": "application/json" },
    });
  }

  return { authHeader, user, userClient };
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getEncryptionKey() {
  const source = new TextEncoder().encode(encryptionSecret);
  const digest = await crypto.subtle.digest("SHA-256", source);

  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptString(plainText: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey();
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  return `${encodeBase64(iv)}:${encodeBase64(new Uint8Array(cipherBuffer))}`;
}

async function decryptString(payload: string) {
  const [encodedIv, encodedCipher] = payload.split(":");

  if (!encodedIv || !encodedCipher) {
    throw new Error("Encrypted payload is malformed.");
  }

  const iv = decodeBase64(encodedIv);
  const cipher = decodeBase64(encodedCipher);
  const key = await getEncryptionKey();
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);

  return new TextDecoder().decode(plainBuffer);
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function maskSecret(secret: string) {
  const trimmed = secret.trim();
  const suffix = trimmed.slice(-4);
  return `••••${suffix || "key"}`;
}

function buildConversationTitle(content: string) {
  return content.trim().replace(/\s+/g, " ").slice(0, 72) || "New conversation";
}

function classifyTask(content: string): TaskCategory {
  const value = content.toLowerCase();

  if (
    /code|debug|typescript|javascript|python|stack trace|function|bug|refactor|sql|query/.test(value)
  ) {
    return "coding";
  }

  if (/summari[sz]e|analy[sz]e|compare|research|plan|evaluate|tradeoff|decision/.test(value)) {
    return "analysis";
  }

  if (/write|draft|creative|story|brainstorm|headline|campaign|copy/.test(value)) {
    return "creative";
  }

  return "general";
}

function getDefaultModel(provider: ProviderName, category: TaskCategory) {
  if (provider === "openai") {
    return category === "coding" ? "gpt-4.1-mini" : "gpt-4.1-mini";
  }

  if (provider === "anthropic") {
    return category === "analysis" ? "claude-sonnet-4-20250514" : "claude-sonnet-4-20250514";
  }

  return category === "general" ? "gemini-2.5-flash" : "gemini-2.5-flash";
}

function estimateCostUsd(provider: ProviderName, totalTokens: number) {
  const ratesPerThousand: Record<ProviderName, number> = {
    openai: 0.003,
    anthropic: 0.004,
    gemini: 0.0015,
  };

  return Number(((totalTokens / 1000) * ratesPerThousand[provider]).toFixed(6));
}

async function validateProviderSecret(provider: ProviderName, secret: string) {
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI validation failed with ${response.status}.`);
    }
  }

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": secret,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!response.ok) {
      throw new Error(`Anthropic validation failed with ${response.status}.`);
    }
  }

  if (provider === "gemini") {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.set("key", secret);
    url.searchParams.set("pageSize", "1");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Gemini validation failed with ${response.status}.`);
    }
  }
}

async function ensureManagedKey(userId: string) {
  const { data: existing, error: existingError } = await adminClient
    .from("managed_api_keys")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<ManagedApiKeyRow>();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const rawSecret = `altair_${crypto.randomUUID().replace(/-/g, "")}`;
  const secretHash = await sha256Hex(rawSecret);
  const secretPreview = `${rawSecret.slice(0, 14)}…`;

  const { data, error } = await adminClient
    .from("managed_api_keys")
    .insert({
      user_id: userId,
      key_name: "Altair Managed Chat Key",
      secret_hash: secretHash,
      secret_preview: secretPreview,
      status: "active",
    })
    .select("*")
    .single<ManagedApiKeyRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function listWorkspaceState(userId: string) {
  const [credentialsResult, managedKeyResult, usageResult] = await Promise.all([
    adminClient
      .from("provider_credentials")
      .select(publicCredentialColumns)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    adminClient.from("managed_api_keys").select("*").eq("user_id", userId).maybeSingle<ManagedApiKeyRow>(),
    adminClient.from("usage_events").select("*").eq("user_id", userId),
  ]);

  if (credentialsResult.error) {
    throw credentialsResult.error;
  }

  if (managedKeyResult.error) {
    throw managedKeyResult.error;
  }

  if (usageResult.error) {
    throw usageResult.error;
  }

  const credentials = (credentialsResult.data ?? []) as PublicProviderCredentialRow[];
  const usageEvents = (usageResult.data ?? []) as UsageEventRow[];
  const usageSummary = (["openai", "anthropic", "gemini"] as ProviderName[]).map((provider) => {
    const providerCredentials = credentials.filter((credential) => credential.provider === provider);
    const providerUsage = usageEvents.filter((event) => event.provider === provider);

    return {
      provider,
      total_tokens: providerUsage.reduce((sum, event) => sum + event.total_tokens, 0),
      estimated_cost_usd: providerUsage.reduce(
        (sum, event) => sum + Number(event.estimated_cost_usd ?? 0),
        0
      ),
      credential_count: providerCredentials.length,
      valid_credential_count: providerCredentials.filter((credential) => credential.status === "valid").length,
    };
  });

  return {
    credentials,
    managedKey: managedKeyResult.data,
    usageSummary,
  };
}

async function getConversationForUser(userId: string, conversationId: string) {
  const { data, error } = await adminClient
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle<ConversationRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Conversation was not found.");
  }

  return data;
}

async function getMonthlyUsageByCredential(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data, error } = await adminClient
    .from("usage_events")
    .select("credential_id,total_tokens")
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, number>>((accumulator, row) => {
    const credentialId = row.credential_id as string | null;

    if (!credentialId) {
      return accumulator;
    }

    accumulator[credentialId] = (accumulator[credentialId] ?? 0) + Number(row.total_tokens ?? 0);
    return accumulator;
  }, {});
}

async function chooseCredential(
  userId: string,
  content: string,
  routingMode: RoutingMode,
  manualProvider?: ProviderName,
  manualModel?: string
) {
  const category = classifyTask(content);
  const { data, error } = await adminClient
    .from("provider_credentials")
    .select(`${publicCredentialColumns}, encrypted_secret`)
    .eq("user_id", userId)
    .eq("status", "valid");

  if (error) {
    throw error;
  }

  const credentialUsage = await getMonthlyUsageByCredential(userId);
  const credentials = (data ?? []) as ProviderCredentialRow[];
  const eligibleCredentials = credentials.filter((credential) => {
    const usedTokens = credentialUsage[credential.id] ?? 0;
    return credential.monthly_token_cap == null || usedTokens < credential.monthly_token_cap;
  });

  if (!eligibleCredentials.length) {
    throw new Error("No eligible validated provider keys are available. Add or validate a provider key first.");
  }

  if (routingMode === "manual") {
    const selected = eligibleCredentials.find((credential) => credential.provider === manualProvider);

    if (!selected) {
      throw new Error("The selected provider does not have an available validated key.");
    }

    return {
      category,
      credentials: [
        {
          credential: selected,
          model: manualModel?.trim() || getDefaultModel(selected.provider, category),
          score: 100,
        },
      ],
    };
  }

  const providerScores: Record<ProviderName, Record<TaskCategory, number>> = {
    openai: { coding: 8, analysis: 7, creative: 6, general: 7 },
    anthropic: { coding: 7, analysis: 9, creative: 8, general: 7 },
    gemini: { coding: 6, analysis: 7, creative: 7, general: 8 },
  };

  const ranked = eligibleCredentials
    .map((credential) => {
      const usedTokens = credentialUsage[credential.id] ?? 0;
      const capRatio =
        credential.monthly_token_cap && credential.monthly_token_cap > 0
          ? Math.min(usedTokens / credential.monthly_token_cap, 1)
          : 0;
      const validationBonus = credential.last_validated_at ? 1 : 0;
      const freshnessPenalty = capRatio * 3;
      const score = providerScores[credential.provider][category] + validationBonus - freshnessPenalty;

      return {
        credential,
        model: getDefaultModel(credential.provider, category),
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  return {
    category,
    credentials: ranked,
  };
}

async function callOpenAI(secret: string, model: string, prompt: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `OpenAI request failed with ${response.status}.`);
  }

  const content =
    typeof payload.output_text === "string"
      ? payload.output_text
      : Array.isArray(payload.output)
        ? payload.output
            .flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
            .map((item: { text?: string }) => item.text ?? "")
            .join("\n")
        : "";

  return {
    content: content.trim(),
    usage: {
      promptTokens: Number(payload.usage?.input_tokens ?? 0),
      completionTokens: Number(payload.usage?.output_tokens ?? 0),
      totalTokens: Number(payload.usage?.total_tokens ?? 0),
    },
  };
}

async function callAnthropic(secret: string, model: string, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": secret,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Anthropic request failed with ${response.status}.`);
  }

  const content = Array.isArray(payload.content)
    ? payload.content
        .filter((item: { type?: string }) => item.type === "text")
        .map((item: { text?: string }) => item.text ?? "")
        .join("\n")
    : "";

  return {
    content: content.trim(),
    usage: {
      promptTokens: Number(payload.usage?.input_tokens ?? 0),
      completionTokens: Number(payload.usage?.output_tokens ?? 0),
      totalTokens: Number(
        Number(payload.usage?.input_tokens ?? 0) + Number(payload.usage?.output_tokens ?? 0)
      ),
    },
  };
}

async function callGemini(secret: string, model: string, prompt: string) {
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
  url.searchParams.set("key", secret);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Gemini request failed with ${response.status}.`);
  }

  const content = Array.isArray(payload.candidates)
    ? payload.candidates
        .flatMap((candidate: { content?: { parts?: Array<{ text?: string }> } }) =>
          candidate.content?.parts ?? []
        )
        .map((part: { text?: string }) => part.text ?? "")
        .join("\n")
    : "";

  return {
    content: content.trim(),
    usage: {
      promptTokens: Number(payload.usageMetadata?.promptTokenCount ?? 0),
      completionTokens: Number(payload.usageMetadata?.candidatesTokenCount ?? 0),
      totalTokens: Number(payload.usageMetadata?.totalTokenCount ?? 0),
    },
  };
}

async function runProviderCompletion(provider: ProviderName, secret: string, model: string, prompt: string) {
  if (provider === "openai") {
    return callOpenAI(secret, model, prompt);
  }

  if (provider === "anthropic") {
    return callAnthropic(secret, model, prompt);
  }

  return callGemini(secret, model, prompt);
}

async function updateCredentialValidation(
  credentialId: string,
  status: CredentialStatus,
  validationError: string | null
) {
  const { error } = await adminClient
    .from("provider_credentials")
    .update({
      status,
      validation_error: validationError,
      last_validated_at: new Date().toISOString(),
    })
    .eq("id", credentialId);

  if (error) {
    throw error;
  }
}

async function handleCreateCredential(request: Request, userId: string) {
  const body = await request.json();
  const provider = body.provider as ProviderName;
  const label = String(body.label ?? "").trim();
  const secret = String(body.secret ?? "").trim();
  const monthlyTokenCap =
    typeof body.monthlyTokenCap === "number" && Number.isFinite(body.monthlyTokenCap)
      ? Math.max(0, Math.floor(body.monthlyTokenCap))
      : null;

  if (!provider || !["openai", "anthropic", "gemini"].includes(provider)) {
    return errorResponse("Choose a supported provider.", 400);
  }

  if (!label || !secret) {
    return errorResponse("Label and API key are required.", 400);
  }

  const encryptedSecret = await encryptString(secret);
  const { data, error } = await adminClient
    .from("provider_credentials")
    .insert({
      user_id: userId,
      provider,
      label,
      encrypted_secret: encryptedSecret,
      secret_mask: maskSecret(secret),
      monthly_token_cap: monthlyTokenCap,
      status: "pending",
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return errorResponse(error.message, 500);
  }

  try {
    await validateProviderSecret(provider, secret);
    await updateCredentialValidation(data.id, "valid", null);
  } catch (caughtError) {
    await updateCredentialValidation(
      data.id,
      "invalid",
      caughtError instanceof Error ? caughtError.message : "Credential validation failed."
    );
  }

  await ensureManagedKey(userId);
  return jsonResponse(await listWorkspaceState(userId));
}

async function handleValidateCredential(request: Request, userId: string) {
  const body = await request.json();
  const credentialId = String(body.credentialId ?? "").trim();

  if (!credentialId) {
    return errorResponse("credentialId is required.", 400);
  }

  const { data, error } = await adminClient
    .from("provider_credentials")
    .select("id, provider, encrypted_secret")
    .eq("id", credentialId)
    .eq("user_id", userId)
    .maybeSingle<Pick<ProviderCredentialRow, "id" | "provider" | "encrypted_secret">>();

  if (error) {
    return errorResponse(error.message, 500);
  }

  if (!data) {
    return errorResponse("Credential was not found.", 404);
  }

  try {
    const secret = await decryptString(data.encrypted_secret);
    await validateProviderSecret(data.provider, secret);
    await updateCredentialValidation(data.id, "valid", null);
  } catch (caughtError) {
    await updateCredentialValidation(
      data.id,
      "invalid",
      caughtError instanceof Error ? caughtError.message : "Credential validation failed."
    );
  }

  return jsonResponse(await listWorkspaceState(userId));
}

async function handleListCredentials(userId: string) {
  return jsonResponse(await listWorkspaceState(userId));
}

async function handleBootstrapManagedKey(userId: string) {
  await ensureManagedKey(userId);
  return jsonResponse(await listWorkspaceState(userId));
}

async function handleCreateHandoff(request: Request, userId: string) {
  const body = await request.json();
  const accessToken = String(body.accessToken ?? "").trim();
  const refreshToken = String(body.refreshToken ?? "").trim();

  if (!accessToken || !refreshToken) {
    return errorResponse("Both accessToken and refreshToken are required for SSO handoff.", 400);
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const encryptedPayload = await encryptString(
    JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt,
    })
  );

  const { error } = await adminClient.from("sso_handoffs").insert({
    token,
    user_id: userId,
    encrypted_session_payload: encryptedPayload,
    expires_at: expiresAt,
  });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ token, expiresAt });
}

async function handleConsumeHandoff(request: Request) {
  const body = await request.json();
  const token = String(body.token ?? "").trim();

  if (!token) {
    return errorResponse("token is required.", 400);
  }

  const { data, error } = await adminClient
    .from("sso_handoffs")
    .select("*")
    .eq("token", token)
    .maybeSingle<{
      token: string;
      user_id: string;
      encrypted_session_payload: string;
      expires_at: string;
      used_at: string | null;
    }>();

  if (error) {
    return errorResponse(error.message, 500);
  }

  if (!data) {
    return errorResponse("This handoff token does not exist.", 404);
  }

  if (data.used_at) {
    return errorResponse("This handoff token has already been used.", 410);
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return errorResponse("This handoff token has expired.", 410);
  }

  const payload = JSON.parse(await decryptString(data.encrypted_session_payload)) as {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };

  const { error: updateError } = await adminClient
    .from("sso_handoffs")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  if (updateError) {
    return errorResponse(updateError.message, 500);
  }

  return jsonResponse(payload);
}

async function handleListConversations(userId: string) {
  const { data, error } = await adminClient
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ conversations: data ?? [] });
}

async function handleCreateConversation(request: Request, userId: string) {
  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim() || "New conversation";

  const { data, error } = await adminClient
    .from("conversations")
    .insert({
      user_id: userId,
      title,
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single<ConversationRow>();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ conversation: data });
}

async function handleListMessages(url: URL, userId: string) {
  const conversationId = url.searchParams.get("conversationId");

  if (!conversationId) {
    return errorResponse("conversationId is required.", 400);
  }

  const conversation = await getConversationForUser(userId, conversationId);
  const { data, error } = await adminClient
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({
    conversation,
    messages: data ?? [],
  });
}

async function handleChatComplete(request: Request, userId: string) {
  const body = await request.json();
  const content = String(body.content ?? "").trim();
  const routingMode = body.routingMode === "manual" ? "manual" : "auto";
  const manualProvider = body.provider as ProviderName | undefined;
  const manualModel = typeof body.model === "string" ? body.model : undefined;

  if (!content) {
    return errorResponse("content is required.", 400);
  }

  const managedKey = await ensureManagedKey(userId);
  let conversation: ConversationRow;

  if (typeof body.conversationId === "string" && body.conversationId.trim()) {
    conversation = await getConversationForUser(userId, body.conversationId.trim());
  } else {
    const { data, error } = await adminClient
      .from("conversations")
      .insert({
        user_id: userId,
        title: buildConversationTitle(content),
        last_message_at: new Date().toISOString(),
      })
      .select("*")
      .single<ConversationRow>();

    if (error) {
      return errorResponse(error.message, 500);
    }

    conversation = data;
  }

  const routePlan = await chooseCredential(userId, content, routingMode, manualProvider, manualModel);
  let selectedCredential: ProviderCredentialRow | null = null;
  let selectedModel = "";
  let assistantText = "";
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let lastError: string | null = null;

  for (const candidate of routePlan.credentials) {
    try {
      const secret = await decryptString(candidate.credential.encrypted_secret);
      const completion = await runProviderCompletion(
        candidate.credential.provider,
        secret,
        candidate.model,
        content
      );
      selectedCredential = candidate.credential;
      selectedModel = candidate.model;
      assistantText = completion.content;
      usage = completion.usage;
      lastError = null;
      break;
    } catch (caughtError) {
      lastError = caughtError instanceof Error ? caughtError.message : "Provider request failed.";
      await adminClient
        .from("provider_credentials")
        .update({
          status: "error",
          validation_error: lastError,
          last_validated_at: new Date().toISOString(),
        })
        .eq("id", candidate.credential.id);

      if (routingMode === "manual") {
        break;
      }
    }
  }

  if (!selectedCredential) {
    return errorResponse(lastError ?? "The router could not find an available provider.", 502);
  }

  const now = new Date().toISOString();
  const userMessageInsert = {
    conversation_id: conversation.id,
    role: "user" as const,
    content,
    provider: selectedCredential.provider,
    model: selectedModel,
    routing_mode: routingMode,
  };
  const assistantMessageInsert = {
    conversation_id: conversation.id,
    role: "assistant" as const,
    content: assistantText || "The provider returned an empty response.",
    provider: selectedCredential.provider,
    model: selectedModel,
    routing_mode: routingMode,
  };

  const { data: insertedMessages, error: messageError } = await adminClient
    .from("messages")
    .insert([userMessageInsert, assistantMessageInsert])
    .select("*");

  if (messageError) {
    return errorResponse(messageError.message, 500);
  }

  const userMessage = (insertedMessages?.[0] ?? null) as MessageRow | null;
  const assistantMessage = (insertedMessages?.[1] ?? null) as MessageRow | null;

  const { data: updatedConversation, error: conversationError } = await adminClient
    .from("conversations")
    .update({
      title: conversation.title === "New conversation" ? buildConversationTitle(content) : conversation.title,
      last_message_at: now,
    })
    .eq("id", conversation.id)
    .select("*")
    .single<ConversationRow>();

  if (conversationError) {
    return errorResponse(conversationError.message, 500);
  }

  const estimatedCostUsd = estimateCostUsd(selectedCredential.provider, usage.totalTokens);
  const { error: usageError } = await adminClient.from("usage_events").insert({
    user_id: userId,
    credential_id: selectedCredential.id,
    conversation_id: conversation.id,
    provider: selectedCredential.provider,
    model: selectedModel,
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
    estimated_cost_usd: estimatedCostUsd,
  });

  if (usageError) {
    return errorResponse(usageError.message, 500);
  }

  const { error: managedKeyError } = await adminClient
    .from("managed_api_keys")
    .update({ last_used_at: now, status: managedKey.status })
    .eq("id", managedKey.id);

  if (managedKeyError) {
    return errorResponse(managedKeyError.message, 500);
  }

  return jsonResponse({
    conversation: updatedConversation,
    userMessage,
    assistantMessage,
    selectedProvider: selectedCredential.provider,
    selectedModel,
    routingMode,
    usage: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      estimatedCostUsd,
    },
  });
}

function getRoutePath(url: URL) {
  const marker = "/workspace-api";
  const markerIndex = url.pathname.indexOf(marker);

  if (markerIndex < 0) {
    return url.pathname;
  }

  return url.pathname.slice(markerIndex + marker.length) || "/";
}

async function handleRequest(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(request) });
  }

  const url = new URL(request.url);
  const routePath = getRoutePath(url);

  try {
    if (routePath === "/sso-handoff/consume" && request.method === "POST") {
      return await handleConsumeHandoff(request);
    }

    const { user } = await requireUser(request);

    if (routePath === "/credentials/create" && request.method === "POST") {
      return await handleCreateCredential(request, user.id);
    }

    if (routePath === "/credentials/validate" && request.method === "POST") {
      return await handleValidateCredential(request, user.id);
    }

    if (routePath === "/credentials/list" && request.method === "GET") {
      return await handleListCredentials(user.id);
    }

    if (routePath === "/managed-key/bootstrap" && request.method === "POST") {
      return await handleBootstrapManagedKey(user.id);
    }

    if (routePath === "/sso-handoff/create" && request.method === "POST") {
      return await handleCreateHandoff(request, user.id);
    }

    if (routePath === "/conversations" && request.method === "GET") {
      return await handleListConversations(user.id);
    }

    if (routePath === "/conversations" && request.method === "POST") {
      return await handleCreateConversation(request, user.id);
    }

    if (routePath === "/messages" && request.method === "GET") {
      return await handleListMessages(url, user.id);
    }

    if (routePath === "/chat/complete" && request.method === "POST") {
      return await handleChatComplete(request, user.id);
    }

    return errorResponse("Workspace endpoint not found.", 404);
  } catch (caughtError) {
    if (caughtError instanceof Response) {
      return caughtError;
    }

    const message = caughtError instanceof Error ? caughtError.message : "Unexpected workspace error.";
    return errorResponse(message, 500);
  }
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  const response = origin && !allowedOrigins.has(origin)
    ? errorResponse("This origin is not allowed to access the workspace.", 403)
    : await handleRequest(request);

  for (const [name, value] of Object.entries(getCorsHeaders(request))) {
    response.headers.set(name, value);
  }

  return response;
});
