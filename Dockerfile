FROM node:14

WORKDIR /opt/huokanbot
COPY . .
RUN chmod 755 docker/integration-entrypoint.sh
RUN npm ci
RUN npm run build
CMD ./docker/wait-for-it.sh "$DB_HOST:$DB_PORT" -- /opt/huokanbot/docker/integration-entrypoint.sh
