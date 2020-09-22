FROM node:current

WORKDIR /opt/huokanbot
COPY . .
RUN npm install && npm run build
CMD [ "npm", "start" ]
