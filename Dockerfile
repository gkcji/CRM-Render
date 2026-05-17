FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json files for both backend and frontend
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install backend dependencies
RUN cd backend && npm install --production

# Install frontend dependencies
RUN cd frontend && npm install

# Copy all source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port 8080 (Fly.io default for web apps)
EXPOSE 8080

# Start backend server
CMD ["node", "backend/index.js"]
