# Stage 1: build
FROM node:22-alpine AS builder

ARG VITE_API_DOMAIN=http://localhost/api/v1
ARG VITE_TOKEN
ARG VITE_SITE_URL
ENV VITE_API_DOMAIN=$VITE_API_DOMAIN
ENV VITE_TOKEN=$VITE_TOKEN
ENV VITE_SITE_URL=$VITE_SITE_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
