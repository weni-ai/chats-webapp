<template>
  <div class="chat-header">
    <header class="header">
      <unnnic-tool-tip enabled :text="$t('contact_information')" side="right">
        <section class="info clickable">
          <user-avatar
            :username="room.contact.name"
            size="2xl"
            clickable
            :photo-url="usePhoto ? room.contact.photo_url : ''"
            @click="showContactInfo"
            :disabled="!room.is_active"
          />
          <span class="username" @click="showContactInfo" @keypress.enter="showContactInfo">
            {{ room.contact.name }}
          </span>
        </section>
      </unnnic-tool-tip>

      <span class="clickable" @click="$emit('close')" @keypress.enter="$emit('close')">
        <unnnic-tool-tip enabled :text="closeButtonTooltip" side="left">
          <unnnic-icon-svg icon="close-1" size="sm" />
        </unnnic-tool-tip>
      </span>
    </header>

    <section v-if="!room.is_active" class="header-info-message">
      <span class="message">{{ $d(room.date ? new Date(room.date) : new Date(), 'long') }}</span>
    </section>

    <section v-else-if="!room.user" class="header-info-message">
      <span class="message">Contato na fila {{ room.queue.name }} há 8 minutos</span>
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
    usePhoto: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    showContactInfo() {
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

.header-info-message {
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
