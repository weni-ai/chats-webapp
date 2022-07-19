#!/bin/sh
export JSON_STRING='window.configs = { \
  "VUE_APP_CHATS_API_URL":"'${VUE_APP_CHATS_API_URL}'", \
  "VUE_APP_CHATS_API_TOKEN":"'${VUE_APP_CHATS_API_TOKEN}'", \
  "VUE_APP_PARENT_DOMAIN":"'${VUE_APP_PARENT_DOMAIN}'", \
}'
sed -i "s|//CONFIGURATIONS_PLACEHOLDER|${JSON_STRING}|" /usr/share/nginx/html/index.html

exec "$@"