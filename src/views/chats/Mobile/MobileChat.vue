<template>
  <home-chat class="mobile-chat" />
</template>

<script>
import HomeChat from '@/views/chats/Home/HomeChat';

export default {
  name: 'MobileChat',
  components: {
    HomeChat,
  },
};
</script>

<style lang="scss" scoped>
.mobile-chat {
  background-color: $unnnic-color-background-lightest;
}
</style>
