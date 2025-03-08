# ============================
# Builder Stage
# ============================
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy entire source (including src folder)
COPY . .

# Build the application (TypeScript compilation)
RUN npm run build

# ============================
# Runner Stage (Production Image)
# ============================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files again
COPY package*.json ./

# Install only production dependencies, ignoring scripts (like husky install)
RUN npm ci --omit=dev --ignore-scripts

# Copy built output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port your Node API listens on (8080)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
