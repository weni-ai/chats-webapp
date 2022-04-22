<template>
  <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
  <video
    controls
    :width="width"
    :height="shouldInferHeight ? getHeightProportionalToWidthInPixels() : height"
  >
    <source :src="src" />
  </video>
</template>

<script>
export default {
  name: 'MediaVideoPreview',

  props: {
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

  computed: {
    shouldInferHeight() {
      return !this.height || (this.height === 'auto' && this.width);
    },
  },

  methods: {
    getHeightProportionalToWidthInPixels() {
      if (!this.width) return 0;

      return (this.width * 9) / 16; // 16:9 proportion
    },
  },
};
</script>
