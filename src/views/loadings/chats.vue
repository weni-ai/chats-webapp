<template>
  <div class="side-bar">
    <div
      class="unnnic-grid-giant"
      style="padding: 12px 24px"
    >
      <div
        class="unnnic-grid-span-12"
        style="display: flex"
      >
        <div style="margin-right: 285px; margin-top: 26px">
          <UnnnicSkeletonLoading
            height="20px"
            width="90px"
          />
        </div>
        <div style="margin-right: 25px">
          <UnnnicSkeletonLoading
            height="45px"
            width="550px"
          />
        </div>
      </div>
    </div>
    <div
      class="unnnic-grid-giant"
      style="padding: 12px 24px"
    >
      <div
        class="unnnic-grid-span-12"
        style="display: flex"
      >
        <div style="margin-right: 25px">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div style="margin-right: 25px">
          <UnnnicSkeletonLoading
            height="45px"
            width="150px"
          />
        </div>
        <div style="margin-right: 25px">
          <UnnnicSkeletonLoading
            height="45px"
            width="150px"
          />
        </div>
        <div style="margin-right: 25px">
          <UnnnicSkeletonLoading
            height="45px"
            width="150px"
          />
        </div>
        <div style="margin-right: 25px">
          <UnnnicSkeletonLoading
            height="45px"
            width="150px"
          />
        </div>
      </div>
    </div>
    <div class="unnnic-grid-giant">
      <div
        class="unnnic-grid-span-1"
        style="display: flex; flex-direction: column"
      >
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="20px"
            width="90px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
        <div class="skeleton-line">
          <UnnnicSkeletonLoading
            height="45px"
            width="350px"
          />
        </div>
      </div>
    </div>
    <div class="page"></div>
  </div>
</template>

<script>
export default {
  name: 'ProjectsLoading',
};
</script>

<style scoped lang="scss">
.side-bar {
  position: absolute;
  left: 0%;
  right: 0%;
  top: 0%;
  bottom: 0.14%;
  background-color: #ffffff;
  opacity: 2;
  border-radius: 4px;
}
.page {
  background: linear-gradient(90deg, #e8f4f4 0%, #ffffff 100%);
  position: absolute;
  width: 50%;
  height: 80%;
  left: 400px;
  top: 165px;
}

.skeleton-line {
  padding: 7px 0px;
}
</style>
