import Keycloak from 'keycloak-js';
import getEnv from '@/utils/env';

const keycloak = new Keycloak({
  url: getEnv('KEYCLOAK_ISSUER'),
  clientId: getEnv('KEYCLOAK_CLIENT_ID'),
  realm: getEnv('KEYCLOAK_REALM'),
});

keycloak.logout = () => {
  sessionStorage.removeItem('keycloak:user');
  window.location.replace(
    `${keycloak.createLogoutUrl()}&client_id=${encodeURIComponent(
      getEnv('KEYCLOAK_CLIENT_ID'),
    )}&id_token_hint=${encodeURIComponent(keycloak.idToken)}`,
  );
};

let hasInitialized = false;
let refreshTokenInterval = null;

export default {
  plugin: {
    install(Vue) {
      Object.defineProperties(Vue.prototype, {
        $keycloak: {
          get() {
            return keycloak;
          },
        },
      });
    },
  },

  keycloak,

  async isAuthenticated() {
    if (hasInitialized) {
      return keycloak.authenticated;
    }

    let savedKeycloakUser = {};

    try {
      const savedData = sessionStorage.getItem('keycloak:user');
      if (savedData) {
        savedKeycloakUser = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error parsing saved Keycloak user:', error);
      sessionStorage.removeItem('keycloak:user');
    }

    const toInsert = savedKeycloakUser?.token ? savedKeycloakUser : {};

    try {
      const authenticated = await keycloak.init({
        useNonce: false,
        scope: 'email profile openid offline_access',
        pkceMethod: 'S256',
        ...toInsert,
      });

      if (authenticated) {
        sessionStorage.setItem(
          'keycloak:user',
          JSON.stringify({
            token: keycloak.token,
            refreshToken: keycloak.refreshToken,
            idToken: keycloak.idToken,
          }),
        );
      }

      hasInitialized = true;

      if (!refreshTokenInterval && authenticated) {
        refreshTokenInterval = setInterval(() => {
          keycloak
            .updateToken(70)
            .then((refreshed) => {
              if (refreshed) {
                sessionStorage.setItem(
                  'keycloak:user',
                  JSON.stringify({
                    token: keycloak.token,
                    refreshToken: keycloak.refreshToken,
                    idToken: keycloak.idToken,
                  }),
                );
              }
            })
            .catch((error) => {
              console.error('Failed to refresh token:', error);
              sessionStorage.removeItem('keycloak:user');
              hasInitialized = false;
            });
        }, 60000);
      }

      return authenticated;
    } catch (error) {
      console.error('Keycloak initialization error:', error);
      sessionStorage.removeItem('keycloak:user');
      hasInitialized = false;
      return false;
    }
  },
};
