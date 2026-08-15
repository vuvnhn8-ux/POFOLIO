# polofio-analytics — production container.
# Data lives on a mounted volume, NOT in the container filesystem.
#   docker build -t polofio-analytics .
#   docker run -d --name polofio-analytics --restart unless-stopped \
#     --env-file .env -p 127.0.0.1:8787:8787 -v polofio-analytics-data:/app/data \
#     polofio-analytics

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js ./
COPY public ./public

ENV PORT=8787
EXPOSE 8787

VOLUME ["/app/data"]

USER node

CMD ["node", "server.js"]
