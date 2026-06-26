# ---- Stage 1: Build the React app with Node ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
# VITE_API_URL is baked at build time — empty string means same-origin (Nginx proxies /api)
ENV VITE_API_URL=""
RUN npm run build

# ---- Stage 2: Serve the static files with Nginx ----
FROM nginx:alpine

COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
