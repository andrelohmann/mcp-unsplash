FROM node:24-slim AS build
WORKDIR /opt/mcp

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /opt/mcp

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /opt/mcp/build /opt/mcp/build

WORKDIR /workspace

USER node

CMD ["node", "/opt/mcp/build/index.js"]
