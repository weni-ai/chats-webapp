<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    v-if="isFullscreen"
    class="image-preview--fullscreen"
    @click="isFullscreenByUserClick = false"
  >
    <header class="toolbar" @click.stop="() => {}">
      <span @click="$emit('download')" @keypress.enter="$emit('download')">
        <unnnic-icon-svg icon="download-bottom-1" scheme="neutral-snow" class="clickable" />
      </span>
      <span
        @click="isFullscreenByUserClick = false"
        @keypress.enter="isFullscreenByUserClick = false"
      >
        <unnnic-icon-svg icon="close-1" scheme="neutral-snow" class="clickable" />
      </span>
    </header>

    <div class="media__container">
      <img
        :src="src"
        :alt="alt"
        @click="handleImageClick"
        @keypress.enter="handleImageClick"
        @click.stop="() => {}"
      />
    </div>

    <footer class="controls" @click.stop="() => {}">
      <span @click="previousMedia" @keypress.enter="previousMedia">
        <unnnic-icon-svg icon="arrow-left-1-1" scheme="background-snow" class="clickable" />
      </span>
      <span @click="nextMedia" @keypress.enter="nextMedia">
        <unnnic-icon-svg icon="arrow-right-1-1" scheme="background-snow" class="clickable" />
      </span>
    </footer>
  </div>

  <img
    v-else
    :src="src"
    :alt="alt"
    :style="{ width: widthInRem, height: heightInRem }"
    class="clickable"
    @click="handleImageClick"
    @keypress.enter="handleImageClick"
  />
</template>

<script>
export default {
  name: 'MediaImagePreview',

  props: {
    alt: {
      type: String,
      default: '',
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
    fullscreenOnClick: {
      type: Boolean,
      default: false,
    },
    height: {
      type: [String, Number],
      default: 'auto', // calculate by width with proportion of 16:9
      validator: (h) => h === 'auto' || !Number.isNaN(Number(h)),
    },
    src: {
      type: String,
      default: '',
    },
    width: {
      type: [String, Number],
      default: 16 * 14, // 224px (16:9 proportion)
      validator: (w) => !Number.isNaN(Number(w)),
    },
  },

  data: () => ({
    isFullscreenByUserClick: false,
  }),

  computed: {
    isFullscreen() {
      return this.fullscreen || this.isFullscreenByUserClick;
    },
    heightInRem() {
      if (this.shouldInferHeight()) {
        const heightInRem = this.getHeightProportionalToWidthInPixels() / 16;

        return `${heightInRem.toFixed('3')}rem`;
      }

      return `${this.height / 16}rem`;
    },
    widthInRem() {
      return `${this.width / 16}rem`;
    },
  },

  methods: {
    getHeightProportionalToWidthInPixels() {
      if (!this.width) return 0;

      return (this.width * 9) / 16; // 16:9 proportion
    },
    handleImageClick() {
      if (this.fullscreenOnClick) {
        this.isFullscreenByUserClick = true;
      }

      this.$emit('click');
    },
    nextMedia() {
      console.log('next media');
    },
    previousMedia() {
      console.log('previous media');
    },
    shouldInferHeight() {
      return !this.height || (this.height === 'auto' && this.width);
    },
  },
};
</script>

<style lang="scss" scoped>
.image-preview--fullscreen {
  z-index: 10;
  position: absolute;

  top: 0;
  left: 0;

  max-height: 100vh;
  height: 100vh;

  max-width: 100vw;
  width: 100vw;

  padding-bottom: 1rem;
  background: rgba(0, 0, 0, $unnnic-opacity-level-clarifying);

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  .toolbar {
    height: 3rem;
    width: 100%;
    background: rgba(0, 0, 0, $unnnic-opacity-level-clarifying);

    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0 1rem;
  }

  .media__container {
    $height: calc(100vh - 3rem - 2rem - 1rem); // 100vh - toolbar - footer - page's padding-bottom

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    padding: 1rem;

    height: $height;
    max-height: $height;
    width: 100%;

    img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
  }

  .controls {
    height: 2rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
