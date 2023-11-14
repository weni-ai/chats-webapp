<template>
  <main class="chat-messages-loading">
    <div class="chat-messages-loading__messages">
      <unnnic-skeleton-loading width="80px" height="23px" />
      <div class="message">
        <unnnic-skeleton-loading />
      </div>
      <div class="message">
        <unnnic-skeleton-loading />
      </div>
      <div class="message">
        <unnnic-skeleton-loading />
      </div>
      <div class="message">
        <unnnic-skeleton-loading />
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: 'ChatMessagesLoading',
};
</script>

<style lang="scss" scoped>
.chat-messages-loading {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: $unnnic-spacing-sm;

  padding: $unnnic-spacing-sm;
  height: 100%;

  .chat-messages-loading__messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $unnnic-spacing-md;
    grid-template-rows: 23px 95px 95px 70px 70px;

    .message {
      width: 55%;
      height: 100%;
      min-height: 46px;

      & > * {
        width: 100%;
        height: 100%;
      }

      &:nth-of-type(1),
      &:nth-of-type(2) {
        max-height: 95px;
      }
      &:nth-of-type(3),
      &:nth-of-type(4) {
        max-height: 70px;
      }

      &:nth-child(odd) {
        align-self: end;
      }

      &:nth-child(even) {
        align-self: start;
      }
    }
  }
}
</style>
