# 0006 — The OpenRouter key stays in Agent Vault

**ACCEPTED 2026-10-22.** Owner: Mark. Amends 0005.

## Decision
On the production host (lang.reforms.ai) the container never holds the real OpenRouter key. `OPENROUTER_API_KEY` is the literal `placeholder`; outbound HTTPS goes through the Agent Vault proxy (`HTTPS_PROXY=http://<agent token>:@vault.sdkrouter.com:14322`), which injects the real key for `openrouter.ai`. The vault's CA is mounted at `/etc/ssl/av-ca.pem` and trusted through `NODE_EXTRA_CA_CERTS`. The vault is `language`, the agent `language-hel2`; the key is set with `make key-clip P=language` in the vault-box project, which also runs `make check P=language`.

`src/translate/proxy-fetch.ts` opens the tunnel itself (a plain `CONNECT`, then TLS) when `HTTPS_PROXY` is set. Node 22's built-in env-proxy support (`NODE_USE_ENV_PROXY`) cancelled every request against this proxy, so it is not used. Without `HTTPS_PROXY` the global `fetch` runs as before, so a self-hosted instance only needs `OPENROUTER_API_KEY`.

## Why
- A leaked container, log or environment dump holds no key that works elsewhere; rotating the key is one command in the vault, not an edit on the host.
- The app keeps one code path: it still sends `Authorization: Bearer <OPENROUTER_API_KEY>`; the vault replaces it.

## Cost
- Every translation depends on the vault host being reachable. A 407 means a bad agent token, a 403 no rule for the host, a 401 an empty key (`make check P=language` tells which).
- The environment key wins over one saved in Profile (`resolveApiKey`), so on this host Profile → Translator stays empty; the vault supplies the key.
