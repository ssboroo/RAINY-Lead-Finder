FROM node:24-alpine
WORKDIR /app
COPY package.json *.mjs ./
COPY public ./public
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node","server.mjs"]
