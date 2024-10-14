# Use the official Node.js image as the base image
FROM node:20.18.0-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the TypeScript source files and tsconfig.json
COPY ./src ./src
COPY tsconfig.json ./

# Install TypeScript globally
RUN npm install -g typescript

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]  # Adjust 'dist/index.js' to your compiled entry point
