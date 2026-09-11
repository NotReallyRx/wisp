import http from "node:http";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";

const PORT = Number(process.env.PORT) || 9816;
const HOST = process.env.HOST || "0.0.0.0";

// Keep logging minimal.
logging.set_level(logging.WARN);

// ─────────────────────────────────────────────
// Novalee Wisp — permissive configuration
// ─────────────────────────────────────────────

// Wisp v2, with backwards compatibility for v1.
wisp.options.wisp_version = 2;

// No stream limits.
wisp.options.stream_limit_per_host = undefined;
wisp.options.stream_limit_total = undefined;

// Allow all supported stream types.
wisp.options.allow_tcp_streams = true;
wisp.options.allow_udp_streams = true;

// Allow direct IP connections.
wisp.options.allow_direct_ip = true;

// Maximum network access.
// WARNING: This allows access to private/internal networks
// reachable by the server.
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

// Wisp WebSocket endpoint.
server.on("upgrade", (req, socket, head) => {
const url = req.url;

// Accept Wisp only on /wisp/ and normalize the URL
// before passing it to wisp-js.
if (url === "/wisp/" || url?.startsWith("/wisp/?")) {
req.url = "/wisp/";

```
try {
  wisp.routeRequest(req, socket, head);
} catch (error) {
  console.error("Wisp error:", error);
  socket.destroy();
}

return;
```

}

socket.destroy();
});

server.on("error", (error) => {
console.error("Server error:", error);
});

server.listen(PORT, HOST, () => {
console.log(`Novalee Wisp listening on ${HOST}:${PORT}`);
console.log(`Wisp endpoint: ws://${HOST}:${PORT}/wisp/`);
});

function shutdown(signal) {
console.log(`${signal} received, shutting down...`);

server.close(() => process.exit(0));

setTimeout(() => process.exit(1), 10_000).unref();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
