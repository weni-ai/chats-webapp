#!/bin/sh
export JSON_STRING='window.configs = { \
  "VITE_CHATS_API_URL":"'${VITE_CHATS_API_URL}'", \
  "VITE_CHATS_API_TOKEN":"'${VITE_CHATS_API_TOKEN}'", \
  "VITE_CHATS_WEBSOCKET_URL":"'${VITE_CHATS_WEBSOCKET_URL}'", \
  "VITE_FLOWS_API_URL":"'${VITE_FLOWS_API_URL}'", \
  "VITE_BOT_URL":"'${VITE_BOT_URL}'", \
  "VITE_CHATS_ENVIRONMENT":"'${VITE_CHATS_ENVIRONMENT}'", \
  "VITE_KEYCLOAK_ISSUER":"'${VITE_KEYCLOAK_ISSUER}'", \
  "VITE_KEYCLOAK_CLIENT_ID":"'${VITE_KEYCLOAK_CLIENT_ID}'", \
  "VITE_KEYCLOAK_REALM":"'${VITE_KEYCLOAK_REALM}'", \
  "VITE_CHATS_PROJECTS_DASHBOARD_TIMER_REFRESH":"'${VITE_CHATS_PROJECTS_DASHBOARD_TIMER_REFRESH}'", \
  "VITE_HOTJAR_ID":"'${VITE_HOTJAR_ID}'", \
  "SENTRY_DSN":"'${SENTRY_DSN}'", \
}'
sed "s|//CONFIGURATIONS_PLACEHOLDER|${JSON_STRING}|" /usr/share/nginx/html/chats/index.html.tmpl > /tmp/index.html

exec "$@"
