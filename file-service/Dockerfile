# --- Stage 1: Build Environment ---
FROM node:22-alpine AS builder

# 安装构建原生模块所需的完整工具链
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat

WORKDIR /app

# 只要这两个文件，利用缓存
COPY package*.json ./

# 告诉 sharp 不要尝试从源码构建，除非绝对必要
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

# 运行安装
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Runtime Environment ---
FROM node:22-alpine

# 运行时必须包含 vips 库
RUN apk add --no-cache vips

WORKDIR /app

# 仅复制必要文件到生产镜像
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
#COPY --from=builder /app/.env.prod ./.env

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main"]