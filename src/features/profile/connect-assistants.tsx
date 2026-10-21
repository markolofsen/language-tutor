import { Button } from "@/ui";

import { connectInfo } from "@/mcp/connect";

import { CopyButton } from "./copy-button";

const hint = "text-sm text-base-content/60";

export function ConnectAssistants() {
  const info = connectInfo();
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-base-content/60">Connect an assistant</h2>
      <p className={hint}>
        Any of them signs in once with the password of this app (or just taps Allow while you are signed in here). Voice
        modes are worth trying with the same connector.
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Claude</h3>
        <p className={hint}>Open Claude, check the name and address, then press Connect and sign in.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={info.installLink} target="_blank" rel="noreferrer">
              Open Claude
            </a>
          </Button>
          <CopyButton text={info.claudeCodeCommand} label="Copy Claude Code command" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">ChatGPT</h3>
        <p className={hint}>
          Plugins &rarr; Add &rarr; custom MCP server. Name <strong>{info.chatgptName}</strong>, connection Server URL with the
          address below, authentication OAuth, then Create and sign in.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={info.chatgptLink} target="_blank" rel="noreferrer">
              Open ChatGPT plugins
            </a>
          </Button>
          <CopyButton text={info.url} label="Copy address" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Codex</h3>
        <p className={hint}>Run the command in a terminal; it opens a browser to sign in.</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={info.codexCommand} label="Copy Codex command" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">With a header instead of sign-in</h3>
        <p className={hint}>For clients that cannot sign in: send this header on every request.</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={info.header} label="Copy header" />
        </div>
      </div>
    </section>
  );
}
