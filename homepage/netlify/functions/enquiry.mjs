import { createEnquiryHandler } from "../../server/enquiry.mjs";

export default createEnquiryHandler();

export const config = {
  path: "/api/enquiry",
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
