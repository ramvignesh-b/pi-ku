FROM oven/bun:1 AS bun
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .

ARG VITE_API_URL

ENV VITE_API_URL=$VITE_API_URL

RUN bun run build:prod

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=bun /app/dist /srv

# Run rootless, matching how this container has always been deployed.
RUN adduser -D -u 1000 piku \
    && chown -R piku:piku /srv /data /config

USER piku

EXPOSE 8080
