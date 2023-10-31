<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="fullscreen-preview" @click="close">
    <header class="toolbar" @click.stop="() => {}">
      <img
        @click="rotate('left')"
        :src="rotateLeftIcon"
        alt=""
        :class="['unnnic-icon__size--md', 'unnnic--clickable', `unnnic-icon-scheme--neutral-snow`]"
      />
      <img
        @click="rotate('right')"
        :src="rotateRightIcon"
        alt=""
        :class="['unnnic-icon__size--md', 'unnnic--clickable', `unnnic-icon-scheme--neutral-snow`]"
      />
      <img
        @click="zoomHandler"
        :src="zoomIcon"
        alt=""
        :class="['unnnic-icon__size--md', 'unnnic--clickable', `unnnic-icon-scheme--neutral-snow`]"
      />
      <!-- This img above is temporary. Then it will be refactored to an unnnic-icon-svg  -->

      <!-- eslint-disable-next-line vuejs-accessibility/anchor-has-content -->
      <span class="clickable" @click="download">
        <unnnic-icon icon="download-bottom-1" scheme="neutral-snow" />
      </span>
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
import axios from 'axios';

import temporaryZoomIn from '@/assets/temporaryZoomIn.svg';
import temporaryZoomOut from '@/assets/temporaryZoomOut.svg';
import rotateRightIcon from '@/assets/temporaryRedoIcon.svg';
import rotateLeftIcon from '@/assets/temporaryUndoIcon.svg';

export default {
  name: 'FullscreenPreview',

  props: {
    downloadMediaUrl: {
      type: String,
      required: true,
    },
    downloadMediaName: {
      type: String,
    },
  },

  data() {
    return {
      zoomIcon: temporaryZoomIn,
      rotateRightIcon,
      rotateLeftIcon,
      isZoomed: false,
      rotatedDeg: 0,
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
        this.resetZoom();
      } else {
        this.isZoomed = true;
        this.zoomScale += this.zoomInterval;
        this.zoomIcon = temporaryZoomOut;
      }
    },

    resetZoom() {
      this.zoomIcon = temporaryZoomIn;
      this.resetPan();
      this.isZoomed = false;
    },

    rotate(side) {
      const rotateInterval = 90;
      if (side === 'right') {
        this.rotatedDeg = (this.rotatedDeg + rotateInterval) % 360;
      } else {
        this.rotatedDeg = (this.rotatedDeg - rotateInterval) % 360;
      }
      this.resetZoom();
    },

    resetRotate() {
      this.rotatedDeg = 0;
    },

    download() {
      function treatedUrl(url) {
        // Gambiarra alert: function required to be able to download images in dev and prod.
        // Adding region in chats prod image url and deleting region in flows dev image url.

        const domain = 's3';
        const mappings = {
          'production-chats': {
            region: 'sa-east-1',
          },
          'develop-flows': {
            region: 'us-east-1',
          },
        };

        if (
          url.includes('production-chats') &&
          !url.includes(mappings['production-chats'].region)
        ) {
          const { region } = mappings['production-chats'];
          const [part1, part2] = url.split(domain);

          if (part2) {
            return `${part1}${domain}.${region}${part2}`;
          }
        }

        if (url.includes('develop-flows') && url.includes(mappings['develop-flows'].region)) {
          const { region } = mappings['develop-flows'];
          return url.replace(`.${region}`, '');
        }

        return url;
      }

      const url = treatedUrl(this.downloadMediaUrl);

      axios
        .get(url)
        .then((response) => response.blob())
        .then((blob) => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = this.downloadMediaName;

          link.click();

          window.URL.revokeObjectURL(link.href);
        })
        .catch(() => {
          const link = document.createElement('a');
          link.target = '_blank';
          link.href = this.downloadMediaUrl;
          link.download = this.downloadMediaName;

          link.click();
        });
    },

    next() {
      this.resetZoom();
      this.resetRotate();
      this.$emit('next');
    },

    previous() {
      this.resetZoom();
      this.resetRotate();
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
      if (this.isAbleToPlan && this.isPanning) {
        const { containerWidth, containerHeight } = this.getMediaDimensions();
        const { mainDimension, secondaryDimension } = this.getWrapperDimensions();

        const x = this.getEventX(event);
        const y = this.getEventY(event);

        const maxX = Math.abs(containerWidth - mainDimension * this.zoomScale) / 2;
        const maxY = Math.abs(containerHeight - secondaryDimension * this.zoomScale) / 2;

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

      if (mediaContainer && mediaWrapper) {
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
      }
      return {};
    },

    getWrapperDimensions() {
      const { wrapperWidth, wrapperHeight } = this.getMediaDimensions();
      const isHorizontal = this.rotateDirection === 'horizontal';
      const mainDimension = isHorizontal ? wrapperWidth : wrapperHeight;
      const secondaryDimension = isHorizontal ? wrapperHeight : wrapperWidth;

      return {
        mainDimension,
        secondaryDimension,
      };
    },

    checkIsAbleToPan() {
      const { containerWidth, containerHeight } = this.getMediaDimensions();
      const { mainDimension, secondaryDimension } = this.getWrapperDimensions();

      const isWidthAbleToPan = containerWidth < mainDimension * this.zoomScale;
      const isHeightAbleToPan = containerHeight < secondaryDimension * this.zoomScale;

      this.isAbleToPlan = isWidthAbleToPan || isHeightAbleToPan;
      if (!this.isAbleToPlan) {
        this.resetPan();
      }
    },
  },

  computed: {
    rotateDirection() {
      const isVertical = [90, 270].includes(Math.abs(this.rotatedDeg));
      return isVertical ? 'vertical' : 'horizontal';
    },

    mediaStyle() {
      const { containerHeight } = this.getMediaDimensions();
      return {
        transform: `translate(${this.panOffsetX}px, ${this.panOffsetY}px) scale(${
          this.isZoomed ? this.zoomScale : 1
        }) rotate(${this.rotatedDeg}deg)`,
        cursor: this.isZoomed && this.isAbleToPlan ? 'grab' : 'auto',
        transition: this.isPanning ? 'none' : 'all 0.3s ease',
        width: this.rotateDirection === 'vertical' ? `${containerHeight}px` : '100%',
      };
    },
  },

  watch: {
    zoomScale() {
      this.checkIsAbleToPan();
    },
    rotatedDeg() {
      this.checkIsAbleToPan();
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
