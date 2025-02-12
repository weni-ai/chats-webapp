<template>
  <footer class="footer">
    <ViewButton
      v-if="!isOpen"
      :handleClick="openDrawer"
      :expandedMore="isOpen"
    />
  </footer>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="drawer-overlay"
      @click="closeDrawer"
    ></div>
    <div
      class="drawer"
      :class="{ open: isOpen }"
    >
      <ViewButton
        :handleClick="closeDrawer"
        :expandedMore="isOpen"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import ViewButton from './ViewButton.vue';

const isOpen = ref(false);

const closeDrawer = () => {
  isOpen.value = false;
};

const openDrawer = () => {
  isOpen.value = true;
};
</script>

<style lang="scss" scoped>
section.chats-layout .sidebar .footer {
  padding-right: 0;
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.drawer {
  position: fixed;
  bottom: -(calc(100vw * (3 / 12)));
  width: calc(100vw * (3 / 12));
  height: 22vh;
  transition: bottom 0.3s ease-in-out;
  z-index: 1000;

  border-top: 1px solid $unnnic-color-neutral-soft;
  border-bottom: 1px solid $unnnic-color-neutral-soft;
  border-left: 1px solid $unnnic-color-neutral-soft;
  background-color: $unnnic-color-neutral-lightest;
}

.drawer.open {
  bottom: 0;

  display: flex;
  flex-direction: column;
}
</style>
