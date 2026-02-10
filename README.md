# Unsplash MCP Server

Minimal MCP server that downloads images from Unsplash.

## Environment Variables

`UNSPLASH_ACCESS_KEY`  
Get it from the Unsplash developer portal: https://unsplash.com/developers

## Devcontainer

1. Create a local env file:

```bash
cp .env.example .env
```

2. Add your access key:

```bash
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
```

3. Reopen the folder in the VS Code devcontainer.

The devcontainer installs dependencies automatically.

## Build and Test (Devcontainer)

```bash
npm run build
node build/index.js
```

Run a quick MCP tool call (local stdio):

```bash
npm run test:mcp
```

## Local Docker Build and Run

Test local image build:

```bash
docker build -t mcp-unsplash:local .
```

Run the same test inside the Docker image:

```bash
npm run test:mcp:docker
```

Run the image locally (downloads to `./tmp` in your repo):

```bash
docker run --rm -i \
  -v "$PWD:/workspace" \
  -w /workspace \
  -e UNSPLASH_ACCESS_KEY="${UNSPLASH_ACCESS_KEY}" \
  mcp-unsplash:local
```

## Release Image (GHCR)

Push a semver tag starting with `v`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Image name: `ghcr.io/andrelohmann/mcp-unsplash`

## Codex config.toml

Example container entry (update image tag as needed):

```toml
[mcp_servers.unsplash]
command = "docker"
args = [
  "run",
  "--rm",
  "-i",
  "-v",
  "${PWD}:/workspace",
  "-w",
  "/workspace",
  "-e",
  "UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY}",
  "ghcr.io/andrelohmann/mcp-unsplash:latest"
]
```

## License and Attribution

ISC License. This repository is a fork of `haramishra/mcp-unsplash` and retains the original license.
