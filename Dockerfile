FROM node:24-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package.json *.mjs ./
COPY public ./public
COPY entrypoint.sh ./entrypoint.sh
RUN chmod 755 /app/entrypoint.sh
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
