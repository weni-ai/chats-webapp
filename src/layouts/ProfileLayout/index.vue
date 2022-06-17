<template>
  <section class="profile-layout">
    <section class="options">
      <settings-options :options="options" />
    </section>

    <section class="profile-layout__view">
      <router-view />
    </section>
  </section>
</template>

<script>
import SettingsOptions from '@/layouts/SettingsLayout/components/SettingsOptions';

export default {
  name: 'ProfileView',

  components: {
    SettingsOptions,
  },

  data: () => ({
    options: [
      {
        title: 'Seu Perfil',
        icon: 'single-neutral-2',
        description:
          'Altere suas informações como foto de perfil, nome de usuário ou exclua sua conta.',
        route: '/profile/me',
      },
      {
        title: 'Preferências',
        icon: 'cog-1',
        description: 'Ajuste preferências pessoais e notificações',
        route: '/profile/preferences',
      },
      {
        title: 'Privacidade e segurança',
        icon: 'lock-2-1',
        description:
          'Para deixar a sua conta mas segura, acesse o campo de privacidade e segurança e proteja a sua conta contra ameaças.',
        route: '/profile/privacy',
      },
    ],
  }),
};
</script>

<style lang="scss" scoped>
.profile-layout {
  display: grid;
  grid-template-columns: 33.33% 1fr;
  grid-template-rows: 100%;
  grid-template-areas: 'options content';

  height: 100%;

  padding: {
    top: 1.5rem;
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .options {
    grid-area: options;
    margin-right: 1rem;
    height: 100%;
    border-right: solid 1px $unnnic-color-neutral-soft;
  }
}
</style>
