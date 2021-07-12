FROM node:14-alpine

RUN apk add --no-cache bash git python3

WORKDIR /opt/huokanbot
COPY . .
RUN chmod 755 docker/integration-entrypoint.sh docker/wait-for-it.sh
RUN npm ci
RUN npm run build
CMD ./docker/wait-for-it.sh "$DB_HOST:$DB_PORT" -- /opt/huokanbot/docker/integration-entrypoint.sh
