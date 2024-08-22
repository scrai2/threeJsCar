# Build stage
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install system dependencies required for npm install
RUN apk update && apk add --no-cache python3 make g++

# Install project dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application files to the working directory
COPY . .


# Build the app
RUN npm run build

# Runtime stage
FROM node:18-alpine

# Create a non-root user and a group with a specific numeric user ID
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup -u 1001

# Set the working directory
WORKDIR /usr/src/app

# Change the ownership of the working directory
COPY --from=builder --chown=nodeuser:nodegroup /usr/src/app /usr/src/app

# Set the NODE_ENV environment variable to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3010

# Switch to the non-root user by user ID
USER 1001

# Start the app
CMD ["npm", "start"]
