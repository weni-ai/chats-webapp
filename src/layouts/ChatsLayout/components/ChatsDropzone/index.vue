<template>
  <div
    ref="dropzone"
    class="dropzone"
    :class="{
      dropzone: true,
      dragging: isDragging,
      error: hasError,
    }"
    @dragenter.stop.prevent="dragenter"
    @dragover.stop.prevent="dragover"
    @dragleave.stop.prevent="dragleave"
    @dragend.stop.prevent="dragend"
    @drop.stop.prevent="drop"
  >
    <div v-if="isDragging" class="dropzone__description">
      <unnnic-icon-svg
        class="unnnic-upload-area__dropzone__icon"
        icon="upload-bottom-1"
        :scheme="hasError ? 'feedback-red' : 'brand-weni'"
        size="xl"
      />
      <h1>{{ $t('dropzone.description') }}</h1>
    </div>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'ChatsDropzone',
  data() {
    return {
      hasError: false,
      isDragging: false,
      dragEnterCounter: 0, // to handle dragenter/dragleave on child elements
      currentFiles: null,
    };
  },
  methods: {
    dragenter() {
      this.dragEnterCounter += 1;
      this.isDragging = true;
    },
    dragover() {
      this.isDragging = true;
    },
    dragleave() {
      this.dragEnterCounter -= 1;
      if (this.dragEnterCounter === 0) {
        this.isDragging = false;
      }
    },
    dragend() {
      this.isDragging = false;
    },
    drop() {
      // event
      this.isDragging = false;

      // const { files } = event.dataTransfer;

      // if (this.validateFiles(files)) {
      //   this.addFiles(files);
      // }
    },
    // addFiles(files) {
    //   let totalLength = files.length;

    //   if (!this.shouldReplace) {
    //     totalLength += this.currentFiles.length;
    //   }

    //   if (totalLength > this.maximumUploads) {
    //     this.setErrorState();
    //     return;
    //   }

    //   const validFiles = Array.from(files).filter((file) => {
    //     if (this.validFormat([file]) && this.validSize([file])) {
    //       return true;
    //     }
    //     return false;
    //   });

    //   if (this.shouldReplace) {
    //     this.currentFiles = validFiles;
    //   } else {
    //     this.currentFiles = this.currentFiles.concat(validFiles);
    //   }
    //   this.emitFileChange();
    // },
  },
};
</script>

<style lang="scss" scoped>
@function borderDashed($color) {
  $colorString: unquote('' + $color);
  $cleanColor: str-slice($colorString, 2);
  @return url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23#{$cleanColor}' stroke-width='4' stroke-dasharray='4%2c 12' stroke-dashoffset='9' stroke-linecap='square'/%3e%3c/svg%3e");
}

.dropzone {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: {
    top: $unnnic-spacing-inset-sm;
    right: $unnnic-spacing-inset-sm;
  }

  &.dragging {
    position: relative;

    &::before,
    &::after {
      content: '';
    }

    &::before {
      background-color: $unnnic-color-background-snow;
    }

    &::after {
      border-radius: $unnnic-border-radius-lg;
      // Dashed border with increased dashes spacing and color neutral clean
      background-image: borderDashed($unnnic-color-brand-weni);
    }
  }

  &__description,
  &.dragging::before,
  &.dragging::after {
    z-index: 1000;
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
  }

  &__description {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;

    h1 {
      font-size: $unnnic-font-size-title-sm;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-brand-weni;
    }
  }
}
</style>
