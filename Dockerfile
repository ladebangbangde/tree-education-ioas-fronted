FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=https://ioasbackend.ldbbd.com/api/v1
ARG VITE_API_ROOT_URL=https://ioasbackend.ldbbd.com/api
ARG VITE_UPLOAD_MAX_CONCURRENT_TASKS=2
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_ROOT_URL=${VITE_API_ROOT_URL}
ENV VITE_UPLOAD_MAX_CONCURRENT_TASKS=${VITE_UPLOAD_MAX_CONCURRENT_TASKS}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]