FROM node:14-alpine as builder

WORKDIR /home/app

ARG VUE_APP_CHATS_API_URL=http://localhost:8000/v1
ARG VUE_APP_CHATS_API_TOKEN

ENV VUE_APP_CHATS_API_URL $VUE_APP_CHATS_API_URL
ENV VUE_APP_CHATS_API_TOKEN $VUE_APP_CHATS_API_TOKEN

COPY package.json .
COPY yarn.lock .
RUN yarn install
COPY . .
RUN yarn build

FROM nginx

COPY --from=builder /home/app/dist /usr/share/nginx/html

COPY ./docker/nginx/nginx.conf /etc/nginx
COPY docker-entrypoint.sh /usr/share/nginx/
RUN chmod +x /usr/share/nginx/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT [ "/usr/share/nginx/docker-entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]
