<template>
  <img
    :src="src"
    :alt="alt"
    :style="{ width: widthInRem, height: heightInRem }"
    class="clickable"
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
    shouldInferHeight() {
      return !this.height || (this.height === 'auto' && this.width);
    },
  },
};
</script>
