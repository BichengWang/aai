// Cloudflare Pages Function for POST /api/enquiry: the same handler as the
// Netlify function (netlify/functions/enquiry.mjs) and the Vite dev server,
// reading RESEND_API_KEY, ENQUIRY_FROM_EMAIL and ENQUIRY_TO_EMAIL from the
// Pages project's environment variables.
import { createEnquiryHandler } from "../../server/enquiry.mjs";

export function onRequest({ request, env }) {
  return createEnquiryHandler({ env })(request);
}
