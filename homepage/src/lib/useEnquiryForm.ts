import { useRef, useState, type FormEvent } from "react";

export function useEnquiryForm(kind: "contact" | "enquiry") {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const attempt = useRef({ payload: "", submissionId: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current || sent) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    const payload = JSON.stringify({ ...fields, kind });
    if (attempt.current.payload !== payload) {
      attempt.current = { payload, submissionId: crypto.randomUUID() };
    }
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, kind, submissionId: attempt.current.submissionId }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true || result.submissionId !== attempt.current.submissionId) {
        throw new Error(
          response.status === 429
            ? "Too many messages. Please wait a minute and try again."
            : result?.error || "We couldn't send your message. Please try again or email qx@altairworld.com directly."
        );
      }
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" && cause.name !== "TypeError"
        ? cause.message
        : "We couldn't confirm delivery. Please try again or email qx@altairworld.com directly.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { pending, sent, error, handleSubmit };
}
