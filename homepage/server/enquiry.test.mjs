import assert from "node:assert/strict";
import { test } from "node:test";
import { createEnquiryHandler } from "./enquiry.mjs";

const submission = {
  kind: "enquiry", submissionId: "554d17a5-0553-4315-9b93-e4d6a5928c75", website: "",
  name: "Ada Lovelace", email: "ada@example.com", message: "Find a pet sitter.",
  postcode: "94103", service: "pet-sitting", timeline: "week",
};
const env = { RESEND_API_KEY: "test-key", ENQUIRY_FROM_EMAIL: "enquiries@example.com" };
function request(body = submission, options = {}) {
  return new Request("https://altairworld.com/api/enquiry", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://altairworld.com" },
    body: JSON.stringify(body), ...options,
  });
}

test("invalid and oversized submissions never call the email provider", async () => {
  let calls = 0;
  const handler = createEnquiryHandler({ env, fetchEmail: async () => { calls++; return Response.json({ id: "bad" }); } });
  for (const [body, status] of [
    [{ ...submission, email: "wrong" }, 400],
    [{ ...submission, email: "ada@example.com\r\nBcc: other@example.com" }, 400],
    [{ ...submission, service: "unknown" }, 400],
    [{ ...submission, timeline: "unknown" }, 400],
    [{ ...submission, postcode: " " }, 400],
    [{ ...submission, name: " " }, 400],
    [{ ...submission, message: "x".repeat(5001) }, 400],
    [{ ...submission, message: "x".repeat(40_000) }, 413],
    [{ ...submission, website: "https://spam.example" }, 400],
    [{ ...submission, submissionId: "invalid" }, 400],
    [{ ...submission, kind: "other" }, 400],
    [{ ...submission, kind: "contact", topic: "unknown" }, 400],
    [null, 400],
    [[], 400],
  ]) {
    assert.equal((await handler(request(body))).status, status);
  }
  assert.equal((await handler(request({}, { body: "{" }))).status, 400);
  assert.equal((await handler(request({}, { method: "GET", body: undefined }))).status, 405);
  assert.equal((await handler(request(submission, { headers: { "Content-Type": "text/plain" } }))).status, 415);
  assert.equal((await handler(request(submission, { headers: { "Content-Type": "application/json", Origin: "https://other.example" } }))).status, 403);
  assert.equal(calls, 0);
});

test("missing configuration never calls the provider or returns success", async () => {
  let called = false;
  const handler = createEnquiryHandler({ env: {}, fetchEmail: async () => { called = true; return Response.json({ id: "bad" }); } });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /email qx@altairworld.com/);
  assert.equal(called, false);
});

test("only provider acceptance with an email ID returns success", async () => {
  for (const fetchEmail of [
    async () => { throw new Error("network failure with private details"); },
    async () => Response.json({ message: "private provider error" }, { status: 403 }),
    async () => Response.json({}),
    async () => new Response("invalid JSON"),
  ]) {
    const handler = createEnquiryHandler({ env, fetchEmail });
    const response = await handler(request());
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.ok, undefined);
    assert.doesNotMatch(body.error, /private/);
  }
});

test("server controls recipients, sends plain text, and sets Reply-To and retry key", async () => {
  const handler = createEnquiryHandler({
    env: { ...env, ENQUIRY_TO_EMAIL: "team@example.com" },
    fetchEmail: async (url, init) => {
      assert.equal(url, "https://api.resend.com/emails");
      const outgoing = JSON.parse(init.body);
      assert.deepEqual(outgoing.to, ["team@example.com"]);
      assert.equal(outgoing.from, env.ENQUIRY_FROM_EMAIL);
      assert.equal(outgoing.reply_to, submission.email);
      assert.equal(outgoing.html, undefined);
      assert.match(outgoing.text, /<script>example<\/script>/);
      assert.equal(new Headers(init.headers).get("Idempotency-Key"), `altair-enquiry/${submission.submissionId}`);
      assert.equal(init.signal instanceof AbortSignal, true);
      return Response.json({ id: "provider-id" });
    },
  });
  const response = await handler(request({ ...submission, message: "<script>example</script>", to: "attacker@example.com" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, submissionId: submission.submissionId });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
