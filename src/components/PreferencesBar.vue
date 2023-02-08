<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    ref="preferences-bar"
    class="preferences-bar"
    tabindex="0"
    @focus="open = true"
    @blur="open = false"
  >
    <div class="background">
      <div
        ref="header"
        class="header"
        @mousedown.prevent
        @click.stop="open ? $refs['preferences-bar'].blur() : $refs['preferences-bar'].focus()"
      >
        <div class="label">
          <div class="icon">
            <unnnic-icon size="md" icon="preferences" scheme="neutral-cloudy" />
          </div>

          <div class="text">
            {{ $t('preferences.title') }}
          </div>

          <div class="status-icon">
            <unnnic-icon
              size="xs"
              :icon="open ? 'arrow-button-up-1' : 'arrow-button-down-1'"
              scheme="neutral-darkest"
            />
          </div>
        </div>
      </div>

      <div class="separator"></div>

      <div class="options-container">
        <div
          style="display: flex; justify-content: center"
          @click="openQuickMessage"
          class="button-quick-message"
        >
          <div class="content">
            <unnnic-icon size="md" scheme="neutral-cloudy" icon="flash-1-3" />
            Mensagens rápidas
          </div>
        </div>
        <div
          style="display: flex; justify-content: center"
          @click="navigate('dashboard.manager')"
          class="button-quick-message"
        >
          <div class="content">
            <unnnic-icon size="md" scheme="neutral-cloudy" icon="gauge-dashboard-2" />
            Dashboard
          </div>
        </div>
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
      </div>
    </div>
  </div>
</template>

<script>
import Profile from '@/services/api/resources/profile';
import { unnnicCallAlert } from '@weni/unnnic-system';

export const PREFERENCES_SOUND = 'WENICHATS_PREFERENCES_SOUND';
// export const PREFERENCES_NILO = 'WENICHATS_PREFERENCES_NILO';

export default {
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
      console.log(connection_status, 'connection_status');

      localStorage.setItem('statusAgent', connection_status);

      this.loadingStatus = false;
      this.showStatusAlert(connection_status);
    },

    changeSound() {
      localStorage.setItem(PREFERENCES_SOUND, this.sound ? 'yes' : 'no');
    },

    showStatusAlert(connectionStatus) {
      unnnicCallAlert({
        props: {
          title: ``,
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
  height: $unnnic-font-size-body-md + $unnnic-line-height-md + 2 * $unnnic-spacing-stack-xs;
  border-radius: 4px;

  .header .label {
    user-select: none;
    cursor: pointer;
    padding: $unnnic-spacing-inset-nano;
    display: flex;
    column-gap: $unnnic-spacing-inline-xs;
    align-items: center;

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
      font-size: $unnnic-font-size-body-md;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
    }

    .status-icon {
      padding: $unnnic-spacing-inset-nano / 2;

      * {
        display: block;
      }
    }
  }

  .background {
    background-color: $unnnic-color-background-snow;
    border-radius: $unnnic-border-radius-sm;
  }

  &:focus {
    outline: none;

    .separator {
      display: block;
    }

    .options-container {
      display: flex;
      background: #ffffff;
      opacity: 20;
      z-index: 99999;
      position: relative;
    }

    .background {
      box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.04);
    }
  }

  .separator {
    display: none;
    height: $unnnic-border-width-thinner;
    background-color: $unnnic-color-neutral-soft;
    margin: 0 $unnnic-spacing-inline-xs;
  }

  .options-container {
    display: none;
    flex-direction: column;
    row-gap: $unnnic-spacing-stack-xs;
    padding: $unnnic-spacing-inset-sm;

    .label {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-weight: $unnnic-font-weight-regular;
      font-size: $unnnic-font-size-body-md;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
    }
  }

  .button-quick-message {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    gap: 4px;
    cursor: pointer;
    height: 36px;
    background: rgba(226, 230, 237, 0.16);
    border: 1px solid #d0d3d9;
    border-radius: 4px;
    .content {
      font-family: 'Lato';
      font-style: normal;
      font-weight: 400;
      font-size: 0.75rem;
      color: #67738b;
    }
  }
}
</style>
