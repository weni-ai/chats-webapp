<template>
  <section class="profile-preferences">
    <unnnic-breadcrumb :crumbs="breadcrumb" />

    <main>
      <header class="profile-preferences__header">
        <h1 class="profile-preferences__title">Notificações do WeniChats</h1>
      </header>

      <section class="profile-preferences__content">
        <p class="profile-preferences__label">
          Para seu conforto, habilite e desabilite as notificações sonoras do WeniChats
        </p>

        <section class="profile-preferences__options">
          <unnnic-switch
            v-for="option in options"
            :key="option.label"
            v-model="option.value"
            :textRight="option.label"
          />
        </section>
      </section>
    </main>

    <unnnic-button text="Salvar alterações" type="secondary" />
  </section>
</template>

<script>
export default {
  name: 'ProfilePreferences',

  data: () => ({
    breadcrumb: [
      {
        name: 'Preferências',
      },
    ],
    options: [
      {
        label: 'Som de novas mensagens de contatos que estão aguardando na fila',
        value: true,
      },
      {
        label: 'Som de novas mensagens de chats em andamento',
        value: true,
      },
      {
        label: 'Som de confirmação de ações',
        value: true,
      },
    ],
  }),
};
</script>

<style lang="scss" scoped>
.profile-preferences {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xl;
  margin: {
    left: $unnnic-spacing-inline-lg;
    right: $unnnic-spacing-inline-xl;
  }

  &__header {
    font-family: $unnnic-font-family-primary;
    margin-bottom: $unnnic-spacing-inline-md;
  }

  &__title {
    font-size: $unnnic-font-size-title-md;
    color: $unnnic-color-neutral-black;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;
  }

  &__label {
    font-family: $unnnic-font-size-body-lg;
    color: $unnnic-color-neutral-cloudy;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;
  }
}
</style>
