FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache docker-cli

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]