# Stage 1: Build the React application
# Specify the version to ensure consistent builds
FROM node:21-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Run the server using Caddy
# Specify the version for consistency
FROM caddy:2-alpine


# Copy built assets from the builder stage
COPY --from=build /app/build /srv

# Caddy will pick up the Caddyfile automatically
COPY Caddyfile /etc/caddy/Caddyfile

# Expose the port Caddy listens on
EXPOSE 2000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
