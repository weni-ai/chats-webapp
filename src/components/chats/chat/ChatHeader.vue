<template>
  <div class="chat-header">
    <header class="header">
      <unnnic-tool-tip enabled text="Informações do contato" side="right">
        <section class="info clickable">
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
        </section>
      </unnnic-tool-tip>

      <span class="clickable" @click="$emit('close')" @keypress.enter="$emit('close')">
        <unnnic-tool-tip enabled :text="closeButtonTooltip" side="left">
          <unnnic-icon-svg icon="close-1" size="sm" />
        </unnnic-tool-tip>
      </span>
    </header>

    <section class="chat-closed-message" v-if="chat.closed">
      <span class="message">Chat encerrado em {{ chat.date || getTodayDate() }}</span>
      <unnnic-icon-svg icon="alert-circle-1-1" size="sm" scheme="neutral-darkest" />
    </section>
  </div>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar';

export default {
  name: 'ChatHeader',

  components: {
    UserAvatar,
  },

  props: {
    closeButtonTooltip: {
      type: String,
      default: '',
    },
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
      if (this.chat.username === 'Agente') return;

      this.$emit('show-contact-info');
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-header {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: $unnnic-spacing-inset-sm;

    .info {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-stack-sm;
    }

    .username {
      flex: 1;
      font-weight: $unnnic-font-weight-regular;
      line-height: 1.5rem;
      color: $unnnic-color-neutral-dark;
    }
  }
}

.chat-closed-message {
  display: flex;
  justify-content: center;
  align-items: center;
  background: $unnnic-color-feedback-grey;
  height: 2rem;

  margin-top: $unnnic-spacing-inline-sm;

  .message {
    margin-right: $unnnic-spacing-inline-xs;

    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-regular;
    line-height: 1.375rem;
  }
}
</style>
