<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="video-preview">
    <video class="video-preview__video" ref="player">
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
  },
};
</script>

<style lang="scss" scoped>
@import 'plyr/dist/plyr.css';

.video-preview {
  display: inline-grid;

  --plyr-color-main: #{$unnnic-color-brand-weni-soft};
  --plyr-font-family: #{$unnnic-font-family-secondary};

  :deep() {
    .plyr {
      width: calc(16px * 25);
      height: calc(9px * 25);
    }

    :is(.plyr__progress, .plyr__volume) input[type='range'] {
      min-width: $unnnic-spacing-xl;
    }

    .plyr__volume input[type='range'] {
      max-width: $unnnic-spacing-giant;
    }
  }
}
</style>
