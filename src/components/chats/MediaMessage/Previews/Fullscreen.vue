<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="fullscreen-preview" @click="close">
    <header class="toolbar" @click.stop="() => {}">
      <span @click="close" @keypress.enter="close" class="clickable">
        <unnnic-icon-svg icon="close-1" scheme="neutral-snow" />
      </span>
    </header>

    <div class="media__container">
      <slot />
    </div>

    <footer class="controls" @click.stop="() => {}">
      <span @click="previous" @keypress.enter="previous" class="clickable">
        <unnnic-icon-svg icon="arrow-left-1-1" scheme="background-snow" />
      </span>
      <span @click="next" @keypress.enter="next" class="clickable">
        <unnnic-icon-svg icon="arrow-right-1-1" scheme="background-snow" />
      </span>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'FullscreenPreview',

  methods: {
    close() {
      this.$emit('close');
    },
    download() {
      this.$emit('download');
    },
    next() {
      this.$emit('next');
    },
    previous() {
      this.$emit('previous');
    },
  },
};
</script>

<style lang="scss" scoped>
.fullscreen-preview {
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
    // background: rgba(0, 0, 0, $unnnic-opacity-level-clarifying);

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

    img,
    video {
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
