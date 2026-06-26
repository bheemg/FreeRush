# Playwright's official image ships Chromium + all system deps preinstalled.
FROM mcr.microsoft.com/playwright:v1.49.1-noble
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server.js"]
