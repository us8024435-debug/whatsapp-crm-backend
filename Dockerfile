FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm install

# Copy application source code
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and compile TypeScript to dist/
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=development

CMD ["node", "dist/server.js"]
