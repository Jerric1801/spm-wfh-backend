# Use the official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

COPY .env .env

# Expose the port your app runs on
EXPOSE 3000

# Run the app
# CMD ["npm", "start"]

# Migrate, Seed & Run
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm start"]