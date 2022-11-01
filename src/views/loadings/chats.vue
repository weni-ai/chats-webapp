<template>
  <div class="page">
    <div class="unnnic-grid-giant">
      <!-- <div class="unnnic-grid-span-12">
        <unnnic-skeleton-loading height="104px" />
      </div> -->
      <div class="unnnic-grid-span-4">
        <unnnic-skeleton-loading tag="div" height="104px" />
      </div>

      <div v-for="n in 3" :key="n" class="unnnic-grid-span-4">
        <div class="dash-loading-card">
          <unnnic-skeleton-loading tag="div" width="40px" height="40px" />
          <unnnic-skeleton-loading tag="div" height="40px" />
        </div>
      </div>

      <div class="unnnic-grid-span-4">
        <unnnic-skeleton-loading
          v-for="n in 3"
          tag="div"
          height="107px"
          :key="n"
          style="margin-bottom: 1rem"
        />
      </div>
      <div class="unnnic-grid-span-4">
        <unnnic-skeleton-loading
          v-for="n in 4"
          tag="div"
          height="93px"
          :key="n"
          style="margin-bottom: 1rem"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectsLoading',
};
</script>

<style scoped lang="scss">
.dash-loading-card {
  display: flex;
  > div:first-child {
    margin-right: 1rem;
  }
  div:last-child {
    width: 100%;
  }
}

.page {
  position: absolute;
  left: 0%;
  right: 0%;
  top: 0%;
  bottom: 0.14%;
  background: linear-gradient(90deg, #e8f4f4 0%, #ffffff 100%);
  opacity: 2;
  border-radius: 4px;
}
</style>
