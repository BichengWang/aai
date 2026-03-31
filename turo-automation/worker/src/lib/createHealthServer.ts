import { createServer, type Server } from "node:http";

/**
 * createHealthServer
 *
 * Starts a minimal HTTP server that responds to GET /healthz with 200 OK.
 * Used by container orchestrators (ECS, k8s, docker-compose healthcheck)
 * to verify the worker process is alive.
 *
 * Port is controlled by the HEALTHZ_PORT env var (default 3001).
 */
export function createHealthServer(): Server {
  const port = Number(process.env["HEALTHZ_PORT"] ?? 3001);

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

  server.listen(port, () => {
    console.log(`[worker] healthz listening on port ${port}`);
  });

  return server;
}
