# Stage 1: Build the React application
FROM node:alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Run the server using Caddy
FROM caddy:alpine

# Copy built assets from the builder stage
COPY --from=build /app/build /srv

# Caddy will pick up the Caddyfile automatically
COPY Caddyfile /etc/caddy/Caddyfile

# Expose the port Caddy listens on
EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]