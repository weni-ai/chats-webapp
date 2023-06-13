<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="fullscreen-preview" @click="close">
    <header class="toolbar" @click.stop="() => {}">
      <img
        @click="zoomHandler"
        :src="zoomIcon"
        alt=""
        :class="['unnnic-icon__size--md', 'unnnic--clickable', `unnnic-icon-scheme--neutral-snow`]"
      />
      <!-- This img above is temporary. Then it will be refactored to an unnnic-icon-svg  -->
      <span @click="close" @keypress.enter="close" class="clickable">
        <unnnic-icon-svg icon="close-1" scheme="neutral-snow" />
      </span>
    </header>

    <div
      class="media__container"
      ref="mediaContainer"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="endPan"
    >
      <div class="media__wrapper" ref="mediaWrapper" @click.stop :style="mediaStyle">
        <slot />
      </div>
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
import temporaryZoomIn from '@/assets/temporaryZoomIn.svg';
import temporaryZoomOut from '@/assets/temporaryZoomOut.svg';

export default {
  name: 'FullscreenPreview',

  data() {
    return {
      zoomIcon: temporaryZoomIn,
      isZoomed: false,
      isAbleToPlan: false,
      isPanning: false,
      zoomScale: 1,
      zoomInterval: 0.5,
      panStartX: 0,
      panStartY: 0,
      panOffsetX: 0,
      panOffsetY: 0,
      prevPanOffsetX: 0,
      prevPanOffsetY: 0,
    };
  },

  methods: {
    close() {
      this.$emit('close');
    },

    zoomHandler() {
      if (this.isZoomed) {
        this.zoomScale -= this.zoomInterval;
        this.zoomReset();
      } else {
        this.isZoomed = true;
        this.zoomScale += this.zoomInterval;
        this.zoomIcon = temporaryZoomOut;
      }
    },

    zoomReset() {
      this.zoomIcon = temporaryZoomIn;
      this.resetPan();
      this.isZoomed = false;
    },

    download() {
      this.$emit('download');
    },

    next() {
      this.zoomReset();
      this.$emit('next');
    },

    previous() {
      this.zoomReset();
      this.$emit('previous');
    },

    startPan(event) {
      if (this.isZoomed) {
        if (!this.isPanning) {
          this.isPanning = true;
          this.panStartX = this.getEventX(event);
          this.panStartY = this.getEventY(event);
          this.prevPanOffsetX = this.panOffsetX;
          this.prevPanOffsetY = this.panOffsetY;
        }
      }
    },

    pan(event) {
      const { containerWidth, containerHeight, wrapperWidth, wrapperHeight } =
        this.getMediaDimensions();

      if (this.isAbleToPlan && this.isPanning) {
        const x = this.getEventX(event);
        const y = this.getEventY(event);

        const maxX = Math.abs(containerWidth - wrapperWidth * this.zoomScale) / 2;
        const maxY = Math.abs(containerHeight - wrapperHeight * this.zoomScale) / 2;

        this.panOffsetX = Math.min(Math.max(this.prevPanOffsetX + x - this.panStartX, -maxX), maxX);
        this.panOffsetY = Math.min(Math.max(this.prevPanOffsetY + y - this.panStartY, -maxY), maxY);
      }
    },

    endPan() {
      if (this.isPanning) {
        this.isPanning = false;
        this.prevPanOffsetX = this.panOffsetX;
        this.prevPanOffsetY = this.panOffsetY;
      }
    },

    resetPan() {
      this.panOffsetX = 0;
      this.panOffsetY = 0;
      this.prevPanOffsetX = 0;
      this.prevPanOffsetY = 0;
    },

    getEventX(event) {
      return event.touches ? event.touches[0].clientX : event.clientX;
    },

    getEventY(event) {
      return event.touches ? event.touches[0].clientY : event.clientY;
    },

    getMediaDimensions() {
      const { mediaContainer, mediaWrapper } = this.$refs;
      const containerWidth = mediaContainer.offsetWidth;
      const containerHeight = mediaContainer.offsetHeight;
      const wrapperWidth = mediaWrapper.offsetWidth;
      const wrapperHeight = mediaWrapper.offsetHeight;

      return {
        containerWidth,
        containerHeight,
        wrapperWidth,
        wrapperHeight,
      };
    },
  },

  computed: {
    mediaStyle() {
      return {
        transform: `translate(${this.panOffsetX}px, ${this.panOffsetY}px) scale(${
          this.isZoomed ? this.zoomScale : 1
        })`,
        cursor: this.isZoomed && this.isAbleToPlan ? 'grab' : 'auto',
        transition: this.isPanning ? 'none' : 'transform 0.3s ease',
      };
    },
  },

  watch: {
    zoomScale() {
      if (this.isZoomed) {
        const { containerWidth, containerHeight, wrapperWidth, wrapperHeight } =
          this.getMediaDimensions();

        const widthAbleToPlan = containerWidth < wrapperWidth * this.zoomScale;
        const heightAbleToPlan = containerHeight < wrapperHeight * this.zoomScale;

        this.isAbleToPlan = !!(widthAbleToPlan || heightAbleToPlan);
        if (!this.isAbleToPlan) this.resetPan();
      }
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
    gap: $unnnic-spacing-inline-sm;
    padding: 0 1rem;
  }

  .media__container {
    $height: calc(100vh - 3rem - 2rem - 1rem); // 100vh - toolbar - footer - page's padding-bottom

    display: flex;
    align-items: center;
    justify-content: center;

    height: $height;
    max-height: $height;
    width: 95%;

    overflow: hidden;

    user-select: none;

    .media__wrapper {
      max-height: 100%;
      max-width: 100%;

      display: flex;
      justify-content: center;
      img,
      video {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;

        user-select: none;
        pointer-events: none;
        transition: transform 0.3s ease;
      }
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
