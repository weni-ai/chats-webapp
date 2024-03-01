<template>
  <div class="chat-classifier-loading">
    <unnnic-skeleton-loading v-for="item in 8" :key="`item-${item}`" />
  </div>
</template>

<script>
export default {
  name: 'ChatClassifierLoading',
};
</script>

<style lang="scss" scoped>
$tag-size: 28px;

.chat-classifier-loading {
  display: grid;
  justify-content: space-between;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(5, 1fr);
  gap: $unnnic-spacing-xs;

  width: 100%;

  & > * {
    width: 100%;
    height: $tag-size;
  }
}
</style>
