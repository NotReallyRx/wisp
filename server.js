import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import http from "node:http";
const PORT = 10000

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("wisp server js rewrite");
});

server.on("upgrade", (req, socket, head) => {
  wisp.routeRequest(req, socket, head);
});

server.on("listening", () => {
  console.log("HTTP server listening");
});

server.listen(PORT, "0.0.0.0");
