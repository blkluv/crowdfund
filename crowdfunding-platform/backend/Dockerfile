FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
