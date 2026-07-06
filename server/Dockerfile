FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY index.mjs ./

ENV NODE_ENV=production
ENV PORT=8788

EXPOSE 8788

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8788/api/health || exit 1

CMD ["node", "index.mjs"]
