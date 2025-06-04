# syntax = docker/dockerfile:1

ARG NODE_VERSION="18.17.0"
ARG BASE_VERSION="alpine3.17"
ARG OLD_IMAGE="chats-webapp:latest"
ARG KEEP_DAYS=60

FROM node:${NODE_VERSION}-${BASE_VERSION} AS builder

WORKDIR /app

# Add build arguments for env variables

ARG CHATS_API_URL
ARG CHATS_WEBSOCKET_URL
ARG CHATS_ENVIRONMENT
ARG FLOWS_API_URL
ARG KEYCLOAK_ISSUER
ARG KEYCLOAK_CLIENT_ID
ARG KEYCLOAK_REALM
ARG CHATS_PROJECTS_DASHBOARD_TIMER_REFRESH

# Set them as environment variables

ENV CHATS_API_URL=${CHATS_API_URL}
ENV CHATS_WEBSOCKET_URL=${CHATS_WEBSOCKET_URL}
ENV CHATS_ENVIRONMENT=${CHATS_ENVIRONMENT}
ENV FLOWS_API_URL=${FLOWS_API_URL}
ENV KEYCLOAK_ISSUER=${KEYCLOAK_ISSUER}
ENV KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}
ENV KEYCLOAK_REALM=${KEYCLOAK_REALM}
ENV CHATS_PROJECTS_DASHBOARD_TIMER_REFRESH=${CHATS_PROJECTS_DASHBOARD_TIMER_REFRESH}

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
ARG OLD_IMAGE=${OLD_IMAGE}
ARG KEEP_DAYS=${KEEP_DAYS}

COPY --chown=nginx:nginx docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx docker/nginx/headers /usr/share/nginx/html/headers
COPY --chown=nginx:nginx docker/file_handler.sh /
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html/chats/
COPY --from=old_css --chown=nginx:nginx /usr/share/nginx/html/chats/assets/all.tx[t] /usr/share/nginx/html/chats/assets/*.css /usr/share/nginx/html/chats/assets/

COPY docker-entrypoint.sh /

RUN cd /usr/share/nginx/html/chats/ \
    && /file_handler.sh css

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html/chats/

RUN mv /usr/share/nginx/html/chats/index.html /usr/share/nginx/html/chats/index.html.tmpl \
    && cd /usr/share/nginx/html/chats/ \
    && ln -s /tmp/index.html

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
