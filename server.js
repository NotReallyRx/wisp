import http from "node:http";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";

const PORT = Number(process.env.PORT) || 9816;
const HOST = "0.0.0.0";

// Minimal Wisp logging.
logging.set_level(logging.WARN);

// Wisp v2 (also accepts v1 connections).
wisp.options.wisp_version = 2;

// No stream limits.
wisp.options.stream_limit_per_host = undefined;
wisp.options.stream_limit_total = undefined;

// Allow both stream types.
wisp.options.allow_tcp_streams = true;
wisp.options.allow_udp_streams = true;

// Permissive network configuration.
wisp.options.allow_direct_ip = true;
wisp.options.allow_private_ips = true;
wisp.options.allow_loopback_ips = true;

// DNS configuration.
wisp.options.dns_ttl = 120;
wisp.options.dns_method = "lookup";
wisp.options.dns_result_order = "verbatim";

const HEALTH_RESPONSE = Buffer.from('{"status":"ok"}');
const NOT_FOUND_RESPONSE = Buffer.from("not found");

const server = http.createServer(
{
keepAlive: true,
keepAliveTimeout: 65_000,
headersTimeout: 66_000,
requestTimeout: 0
},
(req, res) => {
if (
req.method === "GET" &&
(req.url === "/" || req.url === "/health")
) {
res.writeHead(200, {
"Content-Type": "application/json; charset=utf-8",
"Content-Length": HEALTH_RESPONSE.length
});

```
  res.end(HEALTH_RESPONSE);
  return;
}

res.writeHead(404, {
  "Content-Type": "text/plain; charset=utf-8",
  "Content-Length": NOT_FOUND_RESPONSE.length
});

res.end(NOT_FOUND_RESPONSE);
```

}
);

// Handle Wisp WebSocket connections.
server.on("upgrade", (req, socket, head) => {
if (!req.url?.startsWith("/wisp")) {
socket.destroy();
return;
}

try {
wisp.routeRequest(req, socket, head);
} catch (error) {
console.error("Wisp upgrade error:", error);
socket.destroy();
}
});

server.on("error", (error) => {
console.error("Server error:", error);
});

server.listen(PORT, HOST, () => {
console.log(`Novalee Wisp listening on ${HOST}:${PORT}`);
});

// Graceful shutdown.
function shutdown(signal) {
console.log(`${signal} received, shutting down...`);

server.close(() => {
process.exit(0);
});

setTimeout(() => {
process.exit(1);
}, 10_000).unref();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
