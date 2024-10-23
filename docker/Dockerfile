# syntax = docker/dockerfile:1

ARG NODE_VERSION="18.14.0"
ARG BASE_VERSION="alpine3.17"
ARG OLD_IMAGE="chat-webapp:latest"
ARG KEEP_DAYS=60

FROM node:${NODE_VERSION}-${BASE_VERSION} as builder

WORKDIR /app

RUN apk --no-cache add git

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn \
    YARN_CACHE_FOLDER=/root/.yarn yarn install

COPY . ./

RUN yarn build

FROM ${OLD_IMAGE} AS old_css
#FROM ${OLD_IMAGE} AS old_css
#
#RUN find "/usr/share/nginx/html/chats/assets/" -maxdepth 1 -mtime +${KEEP_DAYS} -name "*.css" -exec rm -rf '{}' ';' \
#    && mkdir /tmp/old_css \
#    && cp /usr/share/nginx/html/chats/assets/*.css /tmp/old_css

FROM nginxinc/nginx-unprivileged:1.25-alpine
ARG OLD_IMAGE=$OLD_IMAGE

COPY --chown=nginx:nginx docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html/chats/
COPY --from=old_css --chown=nginx:nginx /usr/share/nginx/html/chats/assets/*.css /usr/share/nginx/html/chats/assets/
#COPY --from=old_css --chown=nginx:nginx /tmp/old_css/*.css /usr/share/nginx/html/chats/assets/

COPY docker-entrypoint.sh /
RUN mv /usr/share/nginx/html/chats/index.html /usr/share/nginx/html/chats/index.html.tmpl \
    && cd /usr/share/nginx/html/chats/ \
    && ln -s /tmp/index.html \
    && find "/usr/share/nginx/html/chats/assets/" -maxdepth 1 -mtime +${KEEP_DAYS} -name "*.css" -exec rm -rf '{}' ';'

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
