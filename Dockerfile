FROM node:20.18.0
# Use an official Node runtime as the base image

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm install

# Copy TypeScript configuration and source files
COPY tsconfig.json .
COPY src ./src

RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app
USER node

# Build the TypeScript app
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Bundle app source
COPY . .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 5000

# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "dist/index.js" ]
