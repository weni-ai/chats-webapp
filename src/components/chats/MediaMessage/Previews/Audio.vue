<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="media__content_audio__media__preview">
    <div
      data-testid="play"
      @click="play"
    >
      <UnnnicIcon
        v-if="!isTimerPlaying"
        size="xs"
        icon="controls-play-1"
        clickable
        scheme="neutral-dark"
        data-testid="play-icon"
      />
    </div>
    <div
      data-testid="pause"
      @click="pause"
    >
      <UnnnicIcon
        v-if="isTimerPlaying"
        size="xs"
        icon="controls-pause-1"
        clickable
        scheme="neutral-dark"
        data-testid="pause-icon"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaAudioPreview',

  props: {
    currentAudio: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      isTimerPlaying: false,
      audio: null,
    };
  },

  methods: {
    play() {
      this.audio = new Audio(this.currentAudio);
      if (this.audio.paused) {
        this.audio.play();
        this.isTimerPlaying = true;
        this.audio.onended = () => {
          this.isTimerPlaying = false;
        };
      }
    },
    pause() {
      this.audio.pause();
      this.isTimerPlaying = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.media__content_audio {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: $unnnic-spacing-stack-xs;

  max-width: 100%;

  &__media {
    display: flex;
    align-items: center;
    justify-content: center;
    // aspect-ratio: 1;

    &__preview {
      height: 100%;
      width: 100%;
    }
  }
  .scrollable {
    overflow-y: auto;
    height: 100%;
    background-color: #ffff;
  }
}
</style>
