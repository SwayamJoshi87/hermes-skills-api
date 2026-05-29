FROM node:22-slim

# ─── Python 3 + hermes-agent ─────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --break-system-packages hermes-agent==0.15.2

# Bare-minimum config so hermes skills commands don't choke
ENV HOME=/home/node
RUN mkdir -p /home/node/.hermes && \
    echo "{}" > /home/node/.hermes/config.yaml && \
    hermes --version

# ─── Node.js App ─────────────────────────────────────────────────────────────
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN chown -R node:node /home/node /app

USER node

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/api/health', r => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/index.js"]
