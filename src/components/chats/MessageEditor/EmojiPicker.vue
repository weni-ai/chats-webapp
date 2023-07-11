<template>
  <div
    @click.stop="() => {}"
    @keypress.enter="() => {}"
    ref="pickerContainer"
    class="emoji-picker"
  ></div>
</template>

<script>
import i18n from '@emoji-mart/data/i18n/pt.json';
import { Picker } from 'emoji-mart/';

export default {
  mounted() {
    this.initPicker();
  },

  computed: {
    emojiPickerPreferences() {
      return {
        set: 'apple',
        previewPosition: 'none',
        navPosition: 'bottom',
        noResultsEmoji: 'cry',
        maxFrequentRows: 3,
      };
    },
  },
  methods: {
    initPicker() {
      // eslint-disable-next-line no-new
      new Picker({
        i18n,
        parent: this.$refs.pickerContainer,
        onEmojiSelect: this.onEmojiSelect,
        onClickOutside: () => this.$emit('close'),
        ...this.emojiPickerPreferences,
      });
    },
    onEmojiSelect(emoji) {
      this.$emit('emojiSelected', emoji.native);
    },
  },
};
</script>

<style lang="scss" scoped>
.emoji-picker {
  position: absolute;
  bottom: 100%;

  * {
    font-family: 'Roboto';
  }
}
</style>
