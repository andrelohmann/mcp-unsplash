import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import process from "node:process";

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function usage() {
  return [
    "Usage: node scripts/test-mcp.mjs --query <text> [--count <n>] [--download-path <path>] [--orientation <vertical|horizontal|squarish>] [--filename <name>]",
    "Example: node scripts/test-mcp.mjs --query \"mountains\" --count 1 --download-path /tmp"
  ].join("\n");
}

const accessKey = process.env.UNSPLASH_ACCESS_KEY;
if (!accessKey) {
  console.error("Missing UNSPLASH_ACCESS_KEY in environment.");
  console.error(usage());
  process.exit(1);
}

const query = getArg("--query", "mountains");
const countRaw = getArg("--count", "1");
const downloadPath = getArg("--download-path", "tmp");
const orientation = getArg("--orientation", "");
const filename = getArg("--filename", "");

const toolArgs = { query };
if (countRaw) {
  const count = Number(countRaw);
  if (!Number.isFinite(count)) {
    console.error("Invalid --count value.");
    process.exit(1);
  }
  toolArgs.count = count;
}
if (downloadPath) toolArgs.download_path = downloadPath;
if (orientation) toolArgs.orientation = orientation;
if (filename) toolArgs.filename = filename;

const client = new Client({ name: "mcp-unsplash-test", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
  env: {
    UNSPLASH_ACCESS_KEY: accessKey
  }
});

try {
  await client.connect(transport);
  const result = await client.callTool({
    name: "download_unsplash_images",
    arguments: toolArgs
  });

  for (const content of result.content ?? []) {
    if (content.type === "text") {
      console.log(content.text);
    } else {
      console.log(JSON.stringify(content, null, 2));
    }
  }
} finally {
  await transport.close();
}
