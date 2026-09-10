import http from "node:http";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const PORT = Number(process.env.PORT || 10000);
const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
    }
    res.writeHead(404);
    res.end("not found");
});

server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/wisp")) {
        try { wisp.routeRequest(req, socket, head); }
        catch (e) { console.error(e); socket.destroy(); }
        return;
    }
    socket.destroy();
});

server.listen(PORT, "0.0.0.0", () => console.log("listening on " + PORT));
