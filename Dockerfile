# Build frontend
FROM node:20-alpine AS build

WORKDIR /app

# Install all dependencies (includes server deps now)
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

RUN npm run build

# Production stage - Node.js server (serves frontend + API)
FROM node:20-alpine

WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server code
COPY --from=build /app/server ./server
COPY --from=build /app/package*.json ./

# Install production deps only
RUN npm ci --omit=dev

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
