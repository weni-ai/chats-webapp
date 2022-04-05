<template>
  <div>
    <header class="active-chat-header">
      <user-avatar
        :username="chat.username"
        size="2xl"
        clickable
        @click="showContactInfo"
        :disabled="chat.closed"
      />
      <span class="username" @click="showContactInfo" @keypress.enter="showContactInfo">
        {{ chat.username }}
      </span>
      <span @click="$emit('close')" @keypress.enter="$emit('close')">
        <unnnic-tool-tip enabled text="Encerrar conversa" side="left">
          <unnnic-icon-svg class="close-button" icon="close-1" size="sm" />
        </unnnic-tool-tip>
      </span>
    </header>

    <section class="closed-message" v-if="chat.closed">
      <span class="message">Atendimento encerrado em {{ chat.date || getTodayDate() }}</span>
      <unnnic-icon-svg icon="alert-circle-1-1" size="sm" scheme="neutral-darkest" />
    </section>
  </div>
</template>

<script>
import UserAvatar from '@/components/UserAvatar';

export default {
  name: 'ChatHeader',

  components: {
    UserAvatar,
  },

  props: {
    chat: {
      type: Object,
      required: true,
    },
  },

  methods: {
    getTodayDate() {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }).format(new Date());
    },
    showContactInfo() {
      if (this.chat.username === 'Atendente') return;

      this.$emit('show-contact-info');
    },
  },
};
</script>

<style lang="scss" scoped>
.active-chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  .username,
  .close-button {
    cursor: pointer;
  }

  .username {
    flex: 1;
    font-weight: 400;
    line-height: 1.5rem;
    color: $unnnic-color-neutral-dark;
  }
}

.closed-message {
  display: flex;
  justify-content: center;
  align-items: center;
  background: $unnnic-color-feedback-grey;
  height: 2rem;

  margin-top: 1rem;

  .message {
    margin-right: 0.5rem;

    color: $unnnic-color-neutral-dark;
    font-size: 0.875rem;
    font-weight: $unnnic-font-weight-regular;
    line-height: 1.375rem;
  }
}
</style>
