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
            <unnnic-icon size="sm" icon="preferences" scheme="neutral-cloudy" />
          </div>

          <div class="text">{{ $t('preferences.title') }}</div>

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
        <div class="label">Status</div>

        <unnnic-switch
          v-model="online"
          size="small"
          :text-right="online ? $t('status.online') : $t('status.offline')"
        />

        <div class="label">{{ $t('preferences.notifications.title') }}</div>

        <unnnic-switch
          v-model="sound"
          size="small"
          :text-right="$t('preferences.notifications.sound')"
        />

        <div class="label">{{ $t('preferences.help.title') }}</div>

        <unnnic-switch
          v-model="help"
          size="small"
          :text-right="$t(`preferences.help.nilo.${help ? 'active' : 'disabled'}`)"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      canCloseOnHeaderClick: false,
      open: false,
      online: false,
      sound: false,
      help: false,
    };
  },

  methods: {},
};
</script>

<style lang="scss" scoped>
.preferences-bar {
  position: relative;
  height: $unnnic-font-size-body-md + $unnnic-line-height-md + 2 * $unnnic-spacing-stack-xs;

  .header .label {
    user-select: none;
    cursor: pointer;
    padding: $unnnic-spacing-inset-nano;
    display: flex;
    column-gap: $unnnic-spacing-inline-xs;

    .icon {
      padding: $unnnic-spacing-inset-nano / 4;

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
}
</style>
