<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
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

      <span
        class="clickable"
        v-if="room.user"
        @click="$emit('close')"
        @keypress.enter="$emit('close')"
      >
        <unnnic-tool-tip enabled :text="closeButtonTooltip" side="left">
          <unnnic-icon-svg icon="close-1" size="sm" />
        </unnnic-tool-tip>
      </span>
    </header>

    <section v-if="!room.is_active" class="header-info-message">
      <span class="message">{{
        $d(room.ended_at ? new Date(room.ended_at) : new Date(), 'long')
      }}</span>
    </section>

    <section v-else-if="!room.user" class="header-info-message">
      <span class="message"
        >Contato na fila {{ room.queue.name }} {{ moment(room?.created_on).fromNow() }}</span
      >
    </section>
    <div class="no-internet-connection" style="display: flex" v-if="alertNetwork">
      <unnnic-icon-svg
        style="margin-right: 6px"
        icon="button-refresh-arrow-1"
        scheme="neutral-cloudy"
        size="sm"
      />
      <span @click="reconnect" class="alert-text" style="margin-right: 4px"
        ><b>{{ $t('alert_no_internet_connection.message') }}</b>
        {{ $t('alert_no_internet_connection.verify_connection') }}
        <b style="cursor: pointer"
          ><u>{{ $t('alert_no_internet_connection.reconnect') }}</u></b
        >
      </span>
    </div>
    <div class="header-info-message" style="display: flex" v-if="alert">
      <span @click="openSelectFlow" class="alert-text" style="margin-right: 4px"
        >{{ $t('alert_last_message_date.message') }}
        <u style="cursor: pointer">{{ $t('alert_last_message_date.message_send_flow') }}</u></span
      >
      <unnnic-tool-tip
        enabled
        :text="$t('alert_last_message_date.tip')"
        side="bottom"
        maxWidth="20rem"
      >
        <unnnic-icon-svg icon="information-circle-4" scheme="neutral-cloudy" size="sm" />
      </unnnic-tool-tip>
    </div>
  </div>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar';

const moment = require('moment');

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
    alert: {
      type: Boolean,
      default: false,
    },
    alertNetwork: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    moment,
    showContactInfo() {
      this.$emit('show-contact-info');
    },

    openSelectFlow() {
      this.$emit('open-select-flow');
    },
    reconnect() {
      this.$emit('reconnect');
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
  .alert-text {
    color: $unnnic-color-neutral-cloudy;
    font-size: 0.87rem;
  }
}
.no-internet-connection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
  background: #fbf7c9;

  margin-top: $unnnic-spacing-inline-sm;

  .message {
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-regular;
    line-height: 22px;
  }
  .alert-text {
    color: $unnnic-color-neutral-cloudy;
    font-size: 0.87rem;
  }
}
</style>
