ARG VITE_BASE_PATH=/

# Stage 1: Build the React application
# Specify the version to ensure consistent builds
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

ARG VITE_BASE_PATH

# Install git
RUN apk add --no-cache git

# enable corepack to use pnpm
RUN corepack enable

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and pnpm-lock.yaml files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the rest of the code
COPY . .

# Build the project
RUN pnpm run build

# Stage 2: Run the server using Caddy
# Specify the version for consistency
FROM caddy:2

ARG VITE_BASE_PATH
ENV REACTFLUX_BASE_PATH=$VITE_BASE_PATH

# Copy built assets to the URL path embedded in the frontend bundle
COPY --from=build /app/build /srv${REACTFLUX_BASE_PATH}

# Caddy will pick up the Caddyfile automatically
COPY Caddyfile /etc/caddy/Caddyfile

# Expose the port Caddy listens on
EXPOSE 2000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
