# Use the official Node.js image
FROM node:18

# Install bash to ensure compatibility with bash scripts
RUN apt-get update && apt-get install -y bash

# Set the shell explicitly to ensure consistent behavior across environments
SHELL ["/bin/sh", "-c"]

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Copy environment variables
COPY .env .env

# Expose the port your app runs on
EXPOSE 3000

# Run the app
# CMD ["npm", "start"]

# Migrate, Seed & Run
CMD ["bash", "-c", "npm run db:migrate && npm run db:seed && npm run dev"]