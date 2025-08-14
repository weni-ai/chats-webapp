<template>
  <section :class="['socket-alert-banner', socketStatus]">
    <section
      v-if="socketStatus === 'closed'"
      class="socket-alert-banner__content"
    >
      <UnnnicIcon
        icon="block"
        scheme="neutral-white"
        size="ant"
      />
      <section class="socket-alert-banner__content__text">
        <span>{{ $t('socket_alert_banner.closed.title') }}</span>
        <span
          class="socket-alert-banner__content__text__refresh"
          @click="reconnect"
        >
          {{ $t('socket_alert_banner.closed.refresh') }}
        </span>
        <span>{{ $t('socket_alert_banner.closed.to_continue') }}</span>
      </section>
    </section>

    <p
      v-if="socketStatus === 'connecting'"
      class="socket-alert-banner__content"
    >
      {{ $t('socket_alert_banner.connecting') }}
    </p>
  </section>
</template>

<script>
import { useConfig } from '@/store/modules/config';
import { mapState } from 'pinia';
import unnnic from '@weni/unnnic-system';
export default {
  name: 'AlertBanner',
  computed: {
    ...mapState(useConfig, ['socketStatus']),
  },
  watch: {
    socketStatus(status, oldStatus) {
      if (oldStatus === 'connecting' && status === 'open') {
        unnnic.unnnicCallAlert({
          props: {
            type: 'success',
            text: this.$t('socket_alert_banner.connected'),
          },
        });
      }
    },
  },
  methods: {
    reconnect() {
      this.$root.wsReconnect({ ignoreRetryCount: true });
    },
  },
};
</script>

<style lang="scss" scoped>
.socket-alert-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 38px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $unnnic-color-neutral-white;

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $unnnic-spacing-xs;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-medium;

    &__text__refresh {
      cursor: pointer;
      text-decoration: underline;
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &.closed {
    background-color: $unnnic-color-aux-red-500;
  }

  &.connecting {
    background-color: $unnnic-color-neutral-dark;
  }
}
</style>
