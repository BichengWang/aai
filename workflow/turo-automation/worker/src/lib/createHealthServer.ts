import { createServer, type Server } from "node:http";
import { readPositiveIntEnv } from "./env.js";
import { logWorkerEvent } from "./logger.js";

/**
 * createHealthServer
 *
 * Starts a minimal HTTP server that responds to GET /healthz with 200 OK.
 * Used by container orchestrators (ECS, k8s, docker-compose healthcheck)
 * to verify the worker process is alive.
 *
 * Port is controlled by the HEALTHZ_PORT env var (default 3001).
 * Resolves once the server is listening and rejects if it cannot bind (for
 * example EADDRINUSE), so the caller can fail before any job starts.
 */
export function createHealthServer(): Promise<Server> {
  const port = readPositiveIntEnv("HEALTHZ_PORT", 3001, 65_535);

  const server = createServer((req, res) => {
    if (req.method === "GET" && req.url === "/healthz") {
      const body = JSON.stringify({ status: "ok" });
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      });
      res.end(body);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      logWorkerEvent("healthz.listening", { port });
      resolve(server);
    });
  });
}
