<template>
  <!-- unnnic-modal was not used due to its variation
   for mobile to be outside the design proposed here -->
  <section class="modal-progress-bar-false">
    <UnnnicProgressBar
      v-model="progress"
      :type="type"
      :title="title"
    />
  </section>
</template>

<script>
export default {
  name: 'ModalProgressBarFalse',

  props: {
    title: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      default: 1,
    },
    type: {
      type: String,
      default: 'primary',
    },
  },
  emits: ['close'],

  data() {
    return {
      progress: 0,
    };
  },

  mounted() {
    this.startProgress();
  },

  methods: {
    startProgress() {
      this.progress = 0;
      const interval = 10 * this.duration;
      this.id = setInterval(this.updateProgress, interval);
    },
    updateProgress() {
      if (this.progress === 100) {
        clearInterval(this.id);
        this.$emit('close');
      } else {
        this.progress += 1;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-progress-bar-false {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);

  // The code above was copied from unnnic-modal

  display: grid;
  align-items: center;
  padding: $unnnic-spacing-sm;
}
</style>
