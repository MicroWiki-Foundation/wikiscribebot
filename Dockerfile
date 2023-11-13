FROM node:16.13.2

LABEL org.opencontainers.image.source=https://github.com/MicroWiki-Foundation/wikiscribebot
LABEL org.opencontainers.image.description="WikiScribe Bot"
LABEL org.opencontainers.image.licenses=MIT
 
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
 
RUN npm install
 
COPY . .
 
CMD [ "node", "bot.js" ]