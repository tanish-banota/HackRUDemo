FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/src ./src
COPY backend/db ./db

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/server.js"]