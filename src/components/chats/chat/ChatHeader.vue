<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="chat-header">
    <header class="header">
      <UnnnicToolTip
        enabled
        :text="$t('contact_information')"
        side="right"
      >
        <section class="info clickable">
          <UserAvatar
            :username="room.contact.name"
            size="2xl"
            clickable
            :photoUrl="usePhoto ? room.contact.photo_url : ''"
            :disabled="!room.is_active"
            @click="showContactInfo"
          />
          <span
            class="username"
            @click="showContactInfo"
            @keypress.enter="showContactInfo"
          >
            {{ room.contact.name }}
          </span>
        </section>
      </UnnnicToolTip>

      <span
        v-if="room.user && !!closeButtonTooltip"
        class="clickable"
        @click="$emit('close')"
        @keypress.enter="$emit('close')"
      >
        <UnnnicToolTip
          enabled
          :text="closeButtonTooltip"
          side="left"
        >
          <UnnnicIconSvg
            icon="close-1"
            size="sm"
          />
        </UnnnicToolTip>
      </span>
    </header>

    <section
      v-if="!room.is_active"
      class="header-info-message"
    >
      <span class="message">{{
        $d(room.ended_at ? new Date(room.ended_at) : new Date(), 'long')
      }}</span>
    </section>

    <section
      v-else-if="!room.user"
      class="header-info-message"
    >
      <span class="message"
        >Contato na fila {{ room.queue.name }}
        {{ moment(room?.created_on).fromNow() }}</span
      >
    </section>
    <div
      v-if="alertNetwork"
      class="no-internet-connection"
      style="display: flex"
    >
      <div class="c-loader">
        <UnnnicIconSvg
          style="margin-right: 6px"
          icon="button-refresh-arrow-1"
          scheme="neutral-cloudy"
          size="sm"
        />
      </div>
      <span
        class="alert-text"
        style="margin-right: 4px"
        @click="reconnect"
        ><b>{{ $t('alert_no_internet_connection.message') }}</b>
        {{ $t('alert_no_internet_connection.verify_connection') }}
        <b style="cursor: pointer"
          ><u>{{ $t('alert_no_internet_connection.reconnect') }}</u></b
        >
      </span>
    </div>
    <div
      v-if="alert"
      class="header-info-message"
      style="display: flex"
    >
      <span
        class="alert-text"
        style="margin-right: 4px"
        @click="openSendFlow"
        >{{ $t('alert_last_message_date.message') }}
        <u style="cursor: pointer">{{
          $t('alert_last_message_date.message_send_flow')
        }}</u></span
      >
      <UnnnicToolTip
        enabled
        :text="$t('alert_last_message_date.tip')"
        side="bottom"
        maxWidth="20rem"
      >
        <UnnnicIconSvg
          icon="information-circle-4"
          scheme="neutral-cloudy"
          size="sm"
        />
      </UnnnicToolTip>
    </div>
  </div>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar.vue';

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
  emits: ['close', 'show-contact-info', 'open-send-flow', 'reconnect'],

  methods: {
    moment,
    showContactInfo() {
      this.$emit('show-contact-info');
    },

    openSendFlow() {
      this.$emit('open-send-flow');
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
.c-loader {
  margin-right: 6px;
  animation: is-rotating 1.5s linear infinite;
}

@keyframes is-rotating {
  100% {
    transform: rotate(-360deg);
  }
}
</style>
