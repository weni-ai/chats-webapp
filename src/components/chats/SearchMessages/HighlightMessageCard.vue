<template>
  <section
    data-testid="message-card"
    class="message-card"
    :class="{ active: active }"
  >
    <header
      class="message-card__header"
      data-testid="message-card-header"
    >
      <p
        class="message-card__header-sender"
        data-testid="message-card-sender"
      >
        {{ senderName }}
      </p>
      <p
        class="message-card__header-time"
        data-testid="message-card-time"
      >
        {{ formattedTime }}
      </p>
    </header>
    <section
      class="message-card__content"
      data-testid="message-card-content"
    >
      <HighlightMessageText
        :text="message.text"
        :searchTerm="searchTerm"
      />
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import moment from 'moment';

import HighlightMessageText from './HighlightMessageText.vue';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'MessageCard',
});

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  searchTerm: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const senderName = computed(() => {
  const sender = props.message.contact || props.message.user;
  const fromContact = !!props.message.contact;

  if (!sender) return i18n.global.t('chats.search_messages.automated_support');

  if (sender.name) return sender.name;
  else if (fromContact) return i18n.global.t('unnamed_contact');

  const agentFirstName = sender.first_name || '';
  const agentLastName = sender.last_name || '';
  const agentFullName = [agentFirstName, agentLastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return agentFullName || props.message.user?.email;
});

const formattedTime = computed(() => {
  if (!props.message.created_on) return '';
  return moment(props.message.created_on).format('L, HH:mm');
});
</script>

<style lang="scss" scoped>
.message-card {
  display: flex;
  padding: $unnnic-space-3 $unnnic-space-4;
  flex-direction: column;
  gap: $unnnic-space-1;
  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-soft;
  cursor: pointer;
  &:hover {
    background-color: $unnnic-color-bg-soft;
  }
  &.active {
    background-color: $unnnic-color-bg-soft;
  }
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-sender {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-emphasized;
    }
    &-time {
      font: $unnnic-font-caption-2;
      color: $unnnic-color-fg-emphasized;
    }
  }
}
</style>
