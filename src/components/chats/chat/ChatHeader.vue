<template>
  <div class="chat-header">
    <header class="header">
      <unnnic-tool-tip enabled text="Informações do contato" side="right">
        <section class="info clickable">
          <user-avatar
            :username="room.contact.full_name"
            size="2xl"
            clickable
            @click="showContactInfo"
            :disabled="!room.is_active"
          />
          <span class="username" @click="showContactInfo" @keypress.enter="showContactInfo">
            {{ room.contact.full_name }}
          </span>
        </section>
      </unnnic-tool-tip>

      <span class="clickable" @click="$emit('close')" @keypress.enter="$emit('close')">
        <unnnic-tool-tip enabled :text="closeButtonTooltip" side="left">
          <unnnic-icon-svg icon="close-1" size="sm" />
        </unnnic-tool-tip>
      </span>
    </header>

    <section class="chat-closed-message" v-if="!room.is_active">
      <span class="message">{{ getFullDate(room.date) }}</span>
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
    room: {
      type: Object,
      required: true,
    },
  },

  methods: {
    getFullDate(date) {
      let parsedDate;
      if (date) {
        const [day, month, year] = date.split('/');
        parsedDate = new Date(`${month}/${day}/${year}`);
      } else {
        parsedDate = new Date();
      }

      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
      }).format(parsedDate);
    },
    showContactInfo() {
      if (this.room.contact.full_name === 'Agente') return;

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
  height: 2rem;
  background: $unnnic-color-neutral-light;

  margin-top: $unnnic-spacing-inline-sm;

  .message {
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-regular;
    line-height: 22px;
  }
}
</style>
