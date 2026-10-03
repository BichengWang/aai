import { Readable } from "node:stream";
import { loadEnv } from "vite";
import { createEnquiryHandler } from "./enquiry.mjs";

export function enquiryPlugin() {
  let env;
  return {
    name: "altair-enquiry-api",
    configResolved(config) {
      // These unprefixed secrets stay in the development server process.
      env = { ...loadEnv(config.mode, config.envDir, ""), ...process.env };
    },
    configureServer(server) {
      const handler = createEnquiryHandler({ env });
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split("?")[0] !== "/api/enquiry") return next();
        try {
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers: req.headers,
            ...(req.method !== "GET" && req.method !== "HEAD"
              ? { body: Readable.toWeb(req), duplex: "half" } : {}),
          });
          const response = await handler(request);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
        } catch {
          res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          res.end(JSON.stringify({ error: "Unable to send your message. Please try again." }));
        }
      });
    },
  };
}
