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
      @click.stop="open ? $refs['preferences-bar'].blur() : $refs['preferences-bar'].focus()"
    >
      <div class="label">
        <div class="icon">
          <unnnic-icon size="md" icon="tune" scheme="neutral-cloudy" />
        </div>

        <div class="text">
          {{ $t('preferences.title') }}
        </div>

        <div class="status-icon">
          <unnnic-icon
            size="md"
            :icon="open ? 'expand_less' : 'expand_more'"
            scheme="neutral-darkest"
          />
        </div>
      </div>
    </div>

    <div class="options-container">
      <div class="label">Status</div>

      <unnnic-switch
        :value="$store.state.config.status === 'ONLINE'"
        size="small"
        :text-right="
          $store.state.config.status === 'ONLINE' ? $t('status.online') : $t('status.offline')
        "
        @input="updateStatus"
        :disabled="loadingStatus"
      />

      <div class="label">{{ $t('preferences.notifications.title') }}</div>

      <unnnic-switch
        v-model="sound"
        size="small"
        :text-right="$t('preferences.notifications.sound')"
        @input="changeSound"
      />

      <unnnic-button
        @mousedown.prevent
        :text="$t('quick_messages.title')"
        icon-left="bolt"
        type="secondary"
        size="small"
        @click="openQuickMessage"
      />
      <unnnic-button
        @mousedown.prevent
        v-if="this.dashboard"
        text="Dashboard"
        icon-left="bar_chart_4_bars"
        type="secondary"
        size="small"
        @click="navigate('dashboard.manager')"
      />
    </div>
  </div>
</template>

<script>
import Profile from '@/services/api/resources/profile';
import { unnnicCallAlert } from '@weni/unnnic-system';

export const PREFERENCES_SOUND = 'WENICHATS_PREFERENCES_SOUND';

export default {
  props: {
    dashboard: {
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

  async created() {
    this.getStatus();
    this.sound = (localStorage.getItem(PREFERENCES_SOUND) || 'yes') === 'yes';
    window.dispatchEvent(new CustomEvent(`${this.help ? 'show' : 'hide'}BottomRightOptions`));
  },

  methods: {
    navigate(name) {
      this.$router.push({
        name,
      });
    },
    openQuickMessage() {
      this.$emit('show-quick-messages');
    },
    async updateStatus(online) {
      this.loadingStatus = true;

      const {
        data: { connection_status },
      } = await Profile.updateStatus({
        projectUuid: this.$store.state.config.project,
        status: online ? 'ONLINE' : 'OFFLINE',
      });

      localStorage.setItem('statusAgent', connection_status);

      this.loadingStatus = false;
      this.showStatusAlert(connection_status);
    },

    async getStatus() {
      const response = await Profile.status({ projectUuid: this.$store.state.config.project });
      this.$store.state.config.status = response.data.connection_status;
    },

    changeSound() {
      localStorage.setItem(PREFERENCES_SOUND, this.sound ? 'yes' : 'no');
    },

    showStatusAlert(connectionStatus) {
      unnnicCallAlert({
        props: {
          text: `${this.$t('status_agent')} ${connectionStatus}`,
          icon: 'indicator',
          scheme: connectionStatus === 'ONLINE' ? 'feedback-green' : '$unnnic-color-neutral-black',
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
