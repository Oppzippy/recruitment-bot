FROM node:24-alpine
EXPOSE 80/tcp

RUN apk add --no-cache bash git python3 build-base

RUN mkdir /opt/recruitment-bot

WORKDIR /opt/recruitment-bot

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .
RUN chmod 755 docker/integration-entrypoint.sh docker/wait-for-it.sh

RUN npm run build
ENTRYPOINT /opt/recruitment-bot/docker/integration-entrypoint.sh
