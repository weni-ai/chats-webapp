#!/bin/sh
export JSON_STRING='window.configs = { \
  "VUE_APP_CHATS_API_URL":"'${VUE_APP_CHATS_API_URL}'", \
  "VUE_APP_CHATS_API_TOKEN":"'${VUE_APP_CHATS_API_TOKEN}'", \
  "VUE_APP_CHATS_WEBSOCKET_URL":"'${VUE_APP_CHATS_WEBSOCKET_URL}'", \
  "VUE_APP_LOGROCKET_ID":"'${VUE_APP_LOGROCKET_ID}'", \
  "VUE_APP_LOGROCKET_PARENT_DOMAIN":"'${VUE_APP_LOGROCKET_PARENT_DOMAIN}'", \
  "VUE_APP_BOT_URL":"'${VUE_APP_BOT_URL}'", \
}'
sed "s|//CONFIGURATIONS_PLACEHOLDER|${JSON_STRING}|" /usr/share/nginx/html/chats/index.html.tmpl > /tmp/index.html

exec "$@"
