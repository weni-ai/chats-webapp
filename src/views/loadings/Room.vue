<template>
  <div class="room-loading">
    <!-- <div class="unnnic-grid-giant" style="display: flex; flex-direction: column"> -->
    <unnnic-skeleton-loading height="72px" width="100%" />
    <unnnic-skeleton-loading height="330px" width="100%" />
    <!-- </div> -->
    <!-- <div class="unnnic-grid-giant" style="padding: 12px 24px">
      <div class="unnnic-grid-span-12" style="display: flex">
        <div style="margin-right: 285px; margin-top: 26px">
          <unnnic-skeleton-loading height="20px" width="90px" />
        </div>
        <div style="margin-right: 25px">
          <unnnic-skeleton-loading height="45px" width="550px" />
        </div>
      </div>
    </div> -->
    <!-- <div class="unnnic-grid-giant" style="padding: 12px 24px">
      <div class="unnnic-grid-span-12" style="display: flex">
        <div style="margin-right: 25px">
          <unnnic-skeleton-loading height="45px" width="350px" />
        </div>
        <div style="margin-right: 25px">
          <unnnic-skeleton-loading height="45px" width="150px" />
        </div>
        <div style="margin-right: 25px">
          <unnnic-skeleton-loading height="45px" width="150px" />
        </div>
        <div style="margin-right: 25px">
          <unnnic-skeleton-loading height="45px" width="150px" />
        </div>
        <div style="margin-right: 25px">
          <unnnic-skeleton-loading height="45px" width="150px" />
        </div>
      </div>
    </div> -->
    <!-- <div class="unnnic-grid-giant">
      <div class="unnnic-grid-span-1" style="display: flex; flex-direction: column">
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="20px" width="90px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
      </div>
    </div> -->
  </div>
</template>

<script>
export default {
  name: 'RoomLoading',
};
</script>

<style lang="scss" scoped>
.room-loading {
  display: grid;
  gap: $unnnic-spacing-ant;
  width: 100%;
  position: absolute;
  z-index: 10000;
}
</style>
