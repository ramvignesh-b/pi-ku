FROM oven/bun:1 AS bun
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .

ARG VITE_API_URL

ENV VITE_API_URL=$VITE_API_URL

RUN bun run build:prod

FROM nginxinc/nginx-unprivileged:alpine-slim
RUN touch /tmp/access.log /tmp/error.log
RUN rm /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=bun /app/dist /usr/share/nginx/html
# transfer the ownership since nginx is running rootless
USER root
RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx

EXPOSE 8080
ENTRYPOINT ["nginx", "-e", "/tmp/error.log", "-g", "daemon off;"]
