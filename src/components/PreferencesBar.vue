<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    ref="preferences-bar"
    class="preferences-bar"
    tabindex="0"
    @focus="open = true"
    @blur="open = false"
  >
    <div
      ref="header"
      class="header"
      @mousedown.prevent
      @click.stop="
        open
          ? $refs['preferences-bar'].blur()
          : $refs['preferences-bar'].focus()
      "
    >
      <div class="label">
        <div class="icon">
          <UnnnicIcon
            size="md"
            icon="tune"
            scheme="neutral-cloudy"
          />
        </div>

        <div class="text">
          {{ $t('preferences.title') }}
        </div>

        <div class="status-icon">
          <UnnnicIcon
            size="md"
            :icon="open ? 'expand_less' : 'expand_more'"
            scheme="neutral-darkest"
          />
        </div>
      </div>
    </div>

    <div class="options-container">
      <div class="label">Status</div>
      <UnnnicSwitch
        v-model="statusSwitch"
        size="small"
        :textRight="
          status === 'ONLINE' ? $t('status.online') : $t('status.offline')
        "
        :disabled="loadingStatus"
        @update:model-value="updateStatus"
      />

      <div class="label">{{ $t('preferences.notifications.title') }}</div>

      <UnnnicSwitch
        v-model="sound"
        size="small"
        :textRight="$t('preferences.notifications.sound')"
        @update:model-value="changeSound"
      />

      <UnnnicButton
        v-if="showFlowsTriggerButton"
        :text="$t('flows')"
        size="small"
        type="secondary"
        iconLeft="send"
        @mousedown.prevent
        @click="openFlowsTrigger"
      />
      <UnnnicButton
        :text="$t('quick_messages.title')"
        iconLeft="bolt"
        type="secondary"
        size="small"
        @mousedown.prevent
        @click="openQuickMessage"
      />
      <UnnnicButton
        v-if="dashboard"
        text="Dashboard"
        iconLeft="bar_chart_4_bars"
        type="secondary"
        size="small"
        @mousedown.prevent
        @click="navigate('dashboard.manager')"
      />
    </div>
  </div>
</template>

<script>
import Profile from '@/services/api/resources/profile';
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';

import unnnic from '@weni/unnnic-system';
import { mapState, mapActions } from 'pinia';
import { useConfig } from '@/store/modules/config';
export default {
  props: {
    dashboard: {
      type: Boolean,
      default: false,
    },
    showFlowsTriggerButton: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      canCloseOnHeaderClick: false,
      open: false,
      loadingStatus: false,
      sound: false,
      statusAgent: localStorage.getItem('statusAgent'),
    };
  },

  computed: {
    ...mapState(useConfig, ['status', 'project']),
    statusSwitch: {
      get() {
        return this.status === 'ONLINE';
      },
      set(value) {
        useConfig().$patch({ status: value ? 'ONLINE' : 'OFFLINE' });
      },
    },
  },

  async created() {
    await this.handlingGetStatus();
    this.sound = (localStorage.getItem(PREFERENCES_SOUND) || 'yes') === 'yes';
    window.dispatchEvent(
      new CustomEvent(`${this.help ? 'show' : 'hide'}BottomRightOptions`),
    );
  },

  methods: {
    ...mapActions(useConfig, ['getStatus']),
    navigate(name) {
      this.$router.push({
        name,
      });
    },
    openFlowsTrigger() {
      this.$emit('open-flows-trigger');
    },
    openQuickMessage() {
      this.$emit('show-quick-messages');
    },
    async updateStatus(online) {
      this.loadingStatus = true;

      const {
        data: { connection_status },
      } = await Profile.updateStatus({
        projectUuid: this.project.uuid,
        status: online ? 'ONLINE' : 'OFFLINE',
      });

      localStorage.setItem('statusAgent', connection_status);

      this.loadingStatus = false;
      this.showStatusAlert(connection_status.toLowerCase());
    },

    async handlingGetStatus() {
      const status = await this.getStatus(this.project.uuid);
      useConfig().$patch({
        status,
      });
    },

    changeSound() {
      localStorage.setItem(PREFERENCES_SOUND, this.sound ? 'yes' : 'no');
    },

    showStatusAlert(connectionStatus) {
      unnnic.unnnicCallAlert({
        props: {
          text: `${this.$t('status_agent')} ${connectionStatus}`,
          icon: 'indicator',
          scheme:
            connectionStatus === 'online'
              ? 'feedback-green'
              : '$unnnic-color-neutral-black',
          closeText: 'Fechar',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.preferences-bar {
  position: relative;
  padding: $unnnic-spacing-sm 0;
  margin-left: -$unnnic-spacing-xs;

  .header .label {
    position: relative;
    z-index: 10;

    display: flex;
    align-items: center;
    column-gap: $unnnic-spacing-xs;

    background-color: $unnnic-color-background-snow;

    padding: $unnnic-spacing-xs 0 0 $unnnic-spacing-xs;
    box-sizing: content-box;

    user-select: none;
    cursor: pointer;

    .icon {
      * {
        font-size: 20px;
        display: block;
      }
    }

    .text {
      flex: 1;
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-weight: $unnnic-font-weight-regular;
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
    }

    .status-icon {
      * {
        display: block;
      }
    }
  }

  &:focus {
    outline: none;

    .options-container {
      position: absolute;
      z-index: 9;

      display: flex;

      margin-right: $unnnic-spacing-nano;

      box-shadow: $unnnic-shadow-level-separated;
      border-radius: $unnnic-border-radius-sm;
      background-color: $unnnic-color-background-snow;

      width: calc(100% - $unnnic-spacing-nano);
    }
  }

  .options-container {
    display: none;
    flex-direction: column;
    row-gap: $unnnic-spacing-stack-xs;

    padding: $unnnic-spacing-ant;
    padding-bottom: $unnnic-spacing-xs;

    .label {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-weight: $unnnic-font-weight-regular;
      font-size: $unnnic-font-size-body-md;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
    }
  }
}
</style>
