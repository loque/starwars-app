FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "run", "start:prod"]