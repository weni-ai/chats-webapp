<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div
    class="video-preview"
    :class="{ 'is-fullscreen': isFullcreen }"
  >
    <video
      ref="player"
      class="video-preview__video"
    >
      <source :src="src" />
    </video>
  </div>
</template>

<script>
import Plyr from 'plyr';

export default {
  name: 'MediaVideoPreview',

  props: {
    src: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      player: null,
      isFullcreen: false,
    };
  },

  mounted() {
    this.player = new Plyr(this.$refs.player, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'settings',
        'download',
        'fullscreen',
      ],
      speed: {
        selected: 1,
        options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      },
      i18n: {
        speed: this.$t('video_player.speed'),
      },
      resetOnEnd: true,
    });

    this.player.on('enterfullscreen', () => {
      this.isFullcreen = true;
    });
    this.player.on('exitfullscreen', () => {
      this.isFullcreen = false;
    });
  },
};
</script>

<style lang="scss" scoped>
.video-preview {
  display: inline-grid;

  --plyr-color-main: #{$unnnic-color-weni-600};
  --plyr-font-family: #{$unnnic-font-family-secondary};
  --plyr-control-spacing: #{$unnnic-spacing-xs};

  :deep() {
    .plyr {
      width: 100%;
      height: 100%;
    }

    :is(.plyr__progress, .plyr__volume) input[type='range'] {
      min-width: $unnnic-spacing-xl;

      &::-webkit-slider-thumb {
        cursor: pointer;
      }
    }

    .plyr__volume {
      position: relative;

      display: flex;
      justify-content: center;
      align-items: center;

      input[type='range'] {
        position: absolute;
        bottom: calc(100% + (var(--plyr-control-spacing)));
        padding: var(--plyr-control-spacing);
        box-sizing: content-box;

        rotate: -90deg;

        max-width: $unnnic-spacing-giant;
        opacity: 0;
        visibility: hidden;

        transition: all 0.3s ease;
      }

      &:hover,
      & :hover {
        input[type='range'] {
          opacity: 1;
          visibility: visible;
        }
      }
    }

    .plyr__menu,
    [data-plyr='download'] {
      display: none;
    }
  }

  &.is-fullscreen {
    :deep() {
      .plyr__menu,
      [data-plyr='download'] {
        display: flex;
      }
    }
  }
}
</style>
