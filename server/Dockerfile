FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY *.mjs ./

ENV NODE_ENV=production
ENV PORT=8788

EXPOSE 8788

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:8788/api/v1/health || exit 1

CMD ["node", "index.mjs"]
