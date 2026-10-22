import http from "node:http";
import https from "node:https";
import tls from "node:tls";

/**
 * A fetch that tunnels through the HTTPS_PROXY (Agent Vault) with a plain CONNECT.
 * Node's built-in env-proxy support cancels requests against that proxy, so the
 * tunnel is opened by hand. Without HTTPS_PROXY this is the global fetch.
 * The proxy's CA is trusted through NODE_EXTRA_CA_CERTS.
 */
export function proxyAwareFetch(): typeof fetch {
  const raw = process.env.HTTPS_PROXY;
  if (!raw) return fetch;
  const proxy = new URL(raw);

  return (input, init) =>
    new Promise<Response>((resolve, reject) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const headers = Object.fromEntries(new Headers(init?.headers).entries());
      const body = typeof init?.body === "string" ? init.body : undefined;
      const signal = init?.signal ?? undefined;
      if (signal?.aborted) return reject(signal.reason);

      const connect = http.request({
        host: proxy.hostname,
        port: Number(proxy.port || 80),
        method: "CONNECT",
        path: `${url.hostname}:${url.port || 443}`,
        headers: proxy.username
          ? { "Proxy-Authorization": `Basic ${Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString("base64")}` }
          : {},
      });
      connect.once("error", reject);
      connect.once("connect", (res, socket) => {
        if (res.statusCode !== 200) {
          socket.destroy();
          return reject(new Error(`proxy refused the tunnel (${res.statusCode})`));
        }
        const request = https.request(
          {
            host: url.hostname,
            path: url.pathname + url.search,
            method: init?.method ?? "GET",
            headers,
            createConnection: () => tls.connect({ socket, servername: url.hostname }),
          },
          (response) => {
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer) => chunks.push(chunk));
            response.on("end", () => {
              const out = new Headers();
              for (const [name, value] of Object.entries(response.headers)) if (typeof value === "string") out.set(name, value);
              resolve(new Response(Buffer.concat(chunks), { status: response.statusCode ?? 502, headers: out }));
            });
            response.on("error", reject);
          },
        );
        request.once("error", reject);
        signal?.addEventListener("abort", () => request.destroy(signal.reason as Error), { once: true });
        request.end(body);
      });
      signal?.addEventListener("abort", () => connect.destroy(signal.reason as Error), { once: true });
      connect.end();
    });
}
