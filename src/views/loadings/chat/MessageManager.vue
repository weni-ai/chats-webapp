<template>
  <div class="message-manager-loading">
    <UnnnicSkeletonLoading />
    <UnnnicSkeletonLoading />
    <UnnnicSkeletonLoading />
  </div>
</template>

<script>
export default {
  name: 'MessageManagerLoading',
};
</script>

<style lang="scss" scoped>
$action-button-size: 46px;

.message-manager-loading {
  display: grid;
  gap: $unnnic-spacing-xs;
  grid-template-columns: auto $action-button-size $action-button-size;

  margin-right: $unnnic-spacing-sm;

  & > * {
    width: 100%;
    height: $action-button-size;
  }
}
</style>
