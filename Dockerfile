# docker image

FROM node:20-alpine3.16

# taoj file treen docker
WORKDIR /app

# copy nhung file can thiet 
# dấu chấm tượng trưng cho copy vào thư mục app(root)
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY ecosystem.config.js .
COPY .env.production .
COPY ./src ./src
COPY ./openapi ./openapi

RUN apk update && apk add bash
RUN apk add --no-cache ffmpeg
RUN apk add python3
RUN npm install pm2 -g
RUN npm install
RUN npm run build

# xuất port
EXPOSE 3000

# runtime câu lệnh dùng trong container
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
