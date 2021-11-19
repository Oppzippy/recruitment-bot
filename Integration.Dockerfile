FROM node:17-alpine
EXPOSE 80/tcp
USER root

RUN apk add --no-cache bash git python3 build-base
RUN addgroup -S recruitment-bot && adduser -S recruitment-bot -G recruitment-bot

WORKDIR /opt/recruitment-bot
COPY . .
RUN chmod 755 docker/integration-entrypoint.sh docker/wait-for-it.sh
RUN chown -R recruitment-bot:recruitment-bot .

USER recruitment-bot:recruitment-bot

RUN npm ci
RUN npm run build
ENTRYPOINT bash -c "./docker/wait-for-it.sh \"$DB_HOST:$DB_PORT\" -- /opt/recruitment-bot/docker/integration-entrypoint.sh"
