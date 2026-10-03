export function createEnquiryHandler(options?: {
  env?: Record<string, string | undefined>;
  fetchEmail?: typeof fetch;
}): (request: Request) => Promise<Response>;
