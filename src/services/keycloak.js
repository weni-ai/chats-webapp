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
      savedKeycloakUser = JSON.parse(sessionStorage.getItem('keycloak:user'));
    } catch (error) {
      console.log(error);
    }

    const toInsert = savedKeycloakUser?.token ? savedKeycloakUser : {};

    const authenticated = await keycloak.init({
      useNonce: false,
      scope: 'email profile openid offline_access',
      pkceMethod: 'S256',
      ...toInsert,
    });

    sessionStorage.setItem('keycloak:user', JSON.stringify(keycloak));

    hasInitialized = true;

    setInterval(() => {
      keycloak.updateToken(70).catch(() => {
        console.error('Failed to refresh token');
      });
    }, 6000);

    return authenticated;
  },
};
