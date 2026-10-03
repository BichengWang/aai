export default function EnquiryFormStatus({ error, sent, kind }: {
  error: string;
  sent: boolean;
  kind: "message" | "enquiry";
}) {
  return <>
    {error ? <p className="lab-form-status lab-form-status--error" role="alert">{error}</p> : null}
    {sent ? <p className="lab-form-status" role="status" aria-live="polite">
      Thanks! Your {kind} has been sent to the Altair team. We will follow up soon.
    </p> : null}
  </>;
}
