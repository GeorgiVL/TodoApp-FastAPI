FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    musl \
    libstdc++

COPY package.json package-lock.json ./
RUN npm install

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY e2e/ ./e2e/
COPY playwright.config.ts ./

ENV CI=true
ENTRYPOINT ["npx", "playwright", "test", "--reporter=list"]
