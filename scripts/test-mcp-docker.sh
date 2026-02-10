#!/usr/bin/env bash
set -euo pipefail

HOST_WORKSPACE="${HOST_WORKSPACE:-$(pwd -P)}"

docker run --rm -i --user 0:0 \
  -v "${HOST_WORKSPACE}:/workspace" \
  -w /opt/mcp \
  -e UNSPLASH_ACCESS_KEY="${UNSPLASH_ACCESS_KEY:-}" \
  mcp-unsplash:local \
  node --input-type=module -e "import { Client } from '@modelcontextprotocol/sdk/client'; import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'; const client = new Client({ name: 'mcp-test', version: '1.0.0' }); const transport = new StdioClientTransport({ command: 'node', args: ['/opt/mcp/build/index.js'], cwd: '/workspace', env: { UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY } }); await client.connect(transport); const result = await client.callTool({ name: 'download_unsplash_images', arguments: { query: 'mountains', count: 1, download_path: 'tmp' } }); for (const content of result.content ?? []) { if (content.type === 'text') console.log(content.text); } await transport.close();"
