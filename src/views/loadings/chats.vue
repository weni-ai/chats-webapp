<template>
  <div class="side-bar">
    <div class="unnnic-grid-giant" style="padding: 12px 24px">
      <div class="unnnic-grid-span-10" style="display: flex; justify-content: space-between">
        <div style="margin-top: 25px">
          <unnnic-skeleton-loading height="20px" width="90px" />
        </div>
        <div>
          <unnnic-skeleton-loading height="45px" width="670px" />
        </div>
      </div>
    </div>
    <div class="unnnic-grid-giant" style="padding: 12px 24px">
      <div class="unnnic-grid-span-12" style="display: flex; justify-content: space-between">
        <div>
          <unnnic-skeleton-loading height="45px" width="350px" />
        </div>
        <div>
          <unnnic-skeleton-loading height="45px" width="200px" />
        </div>
        <div>
          <unnnic-skeleton-loading height="45px" width="200px" />
        </div>
        <div>
          <unnnic-skeleton-loading height="45px" width="200px" />
        </div>
        <div>
          <unnnic-skeleton-loading height="45px" width="200px" />
        </div>
      </div>
    </div>
    <div class="unnnic-grid-giant">
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
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
        <div class="skeleton-line"><unnnic-skeleton-loading height="45px" width="350px" /></div>
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
