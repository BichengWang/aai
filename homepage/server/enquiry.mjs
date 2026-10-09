const MAX_BODY_BYTES = 32_768;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SERVICES = new Set(["financial-planning", "legal-services", "local-car-rental", "pet-sitting", "general", "other"]);
const TOPICS = new Set(["services", "partnerships", "support"]);
const TIMELINES = new Set(["24-hours", "week", "flexible", "other"]);

function json(status, body, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function field(body, key, max, required = true) {
  const value = body[key];
  if (!required && value === undefined) return "";
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) {
    throw new Error(`Please provide a valid ${key}.`);
  }
  return value.trim();
}

async function readBody(request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

// Both the deployed function and the local Vite server use this handler.
export function createEnquiryHandler({ env = process.env, fetchEmail = fetch } = {}) {
  return async function handleEnquiry(request) {
    if (request.method !== "POST") {
      return json(405, { error: "Use POST to submit a message." }, { Allow: "POST" });
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json(403, { error: "Please submit your message from the Altair website." });
    }
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return json(415, { error: "Send your message as JSON." });
    }

    let submission;
    try {
      const raw = await readBody(request);
      if (raw === null) return json(413, { error: "Your message is too large." });
      const body = JSON.parse(raw);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid message.");
      // Bots that fill this hidden field never trigger an email.
      if (field(body, "website", 200, false)) return json(400, { error: "Unable to submit this message." });
      const kind = field(body, "kind", 20);
      const submissionId = field(body, "submissionId", 36);
      const name = field(body, "name", 120);
      const email = field(body, "email", 254);
      const message = field(body, "message", 5000);
      if (!UUID.test(submissionId)) throw new Error("Invalid submission ID. Please reload the page.");
      if (!EMAIL.test(email) || /[\r\n]/.test(email)) throw new Error("Please provide a valid email address.");
      if (kind !== "contact" && kind !== "enquiry") throw new Error("Invalid message type.");
      const topic = field(body, "topic", 30, false);
      let postcode = "", service = "", timeline = "";
      if (kind === "enquiry") {
        postcode = field(body, "postcode", 20, false);
        service = field(body, "service", 40);
        timeline = field(body, "timeline", 20);
        if (!SERVICES.has(service)) throw new Error("Please select a valid service.");
        if (!TIMELINES.has(timeline)) throw new Error("Please select a valid timeline.");
      } else if (topic && !TOPICS.has(topic)) {
        throw new Error("Please select a valid topic.");
      }
      submission = { submissionId, kind, name, email, message, topic, postcode, service, timeline };
    } catch (error) {
      return json(400, { error: error instanceof SyntaxError ? "Invalid message format." : error.message });
    }

    const apiKey = env.RESEND_API_KEY?.trim();
    const from = env.ENQUIRY_FROM_EMAIL?.trim();
    const to = env.ENQUIRY_TO_EMAIL?.trim() || "qx@altairworld.com";
    if (!apiKey || !from) {
      return json(503, { error: "Message delivery is temporarily unavailable. Please email qx@altairworld.com directly." });
    }

    const { submissionId, kind, name, email, message, topic, postcode, service, timeline } = submission;
    const text = [
      `New Altair ${kind}`, `Reference: ${submissionId}`, `Name: ${name}`, `Email: ${email}`,
      ...(topic ? [`Topic: ${topic}`] : []),
      ...(kind === "enquiry" ? [...(postcode ? [`Postcode: ${postcode}`] : []), `Service: ${service}`, `Timeline: ${timeline}`] : []),
      "", "Message:", message,
    ].join("\n");
    try {
      const response = await fetchEmail("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `altair-enquiry/${submissionId}`,
          // Resend rejects requests without one (403, error 1010), and fetch on
          // Cloudflare Pages, unlike Node's, sends none.
          "User-Agent": "altair-enquiry/1.0",
        },
        body: JSON.stringify({
          from, to: [to], reply_to: email,
          subject: `Altair ${kind === "enquiry" ? "service enquiry" : "contact message"}${service || topic ? `: ${service || topic}` : ""}`,
          text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.id !== "string" || !result.id) {
        return json(502, { error: "We couldn't send your message. Please try again or email qx@altairworld.com directly." });
      }
      return json(200, { ok: true, submissionId });
    } catch {
      return json(502, { error: "We couldn't confirm delivery. Please try again or email qx@altairworld.com directly." });
    }
  };
}
