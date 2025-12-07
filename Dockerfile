# Stage 1: Build the React application
# Specify the version to ensure consistent builds
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

# Install git
RUN apk add --no-cache git

# enable corepack to use pnpm
RUN corepack enable

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and pnpm-lock.yaml files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Build the project
RUN pnpm run build

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
