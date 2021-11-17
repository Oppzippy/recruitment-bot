FROM node:17-alpine
EXPOSE 80/tcp
USER root

RUN apk add --no-cache bash git python3 build-base
RUN addgroup -S huokanbot && adduser -S huokanbot -G huokanbot

WORKDIR /opt/huokanbot
COPY . .
RUN chmod 755 docker/integration-entrypoint.sh docker/wait-for-it.sh
RUN chown -R huokanbot:huokanbot .

USER huokanbot:huokanbot

RUN npm ci
RUN npm run build
CMD ./docker/wait-for-it.sh "$DB_HOST:$DB_PORT" -- npm run migrate --production && npm start
