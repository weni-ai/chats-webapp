<template>
  <div
    ref="rootEl"
    class="chats-contact"
    :class="{
      selected,
      disabled,
      'unread-messages': unreadMessages,
      waiting: waitingTime && !discussionGoal,
    }"
    :tabindex="0"
    @click.stop="handleContactClick"
    @keypress.enter="handleContactKeypress"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @mousedown="handleRippleMouseDown"
  >
    <slot name="avatar">
      <UnnnicChatsUserAvatar
        v-if="discussionGoal"
        scheme="bg-purple-plain"
      >
        <template #content>
          <UnnnicIcon
            icon="communication"
            scheme="fg-base"
          />
        </template>
      </UnnnicChatsUserAvatar>
      <UnnnicChatsUserAvatar
        v-else
        :username="title"
        :photoUrl="userPhoto"
        :active="isHovered || selected"
        scheme="bg-muted"
        textColor="fg-emphasized"
      />
    </slot>
    <div class="chats-contact__infos">
      <section class="chats-contact__infos__title-container">
        <h1
          class="chats-contact__infos__title ellipsis"
          :title="title"
          :class="{ bold: unreadMessages }"
        >
          {{ contactName }}
        </h1>

        <p
          v-if="projectName"
          class="chats-contact__infos__project-tag"
        >
          {{ projectName }}
        </p>
      </section>
      <div
        class="chats-contact__infos__additional-information"
        :class="{
          bold:
            unreadMessages ||
            (checkboxWhenSelect && selected) ||
            newMessageIndicator,
        }"
      >
        <p
          v-if="waitingTime !== 0 && !discussionGoal"
          class="ellipsis"
        >
          {{ $t('waiting_for', waitingTime, { waitingTime }) }}
        </p>
        <template v-else-if="lastMessageMedia.isMedia">
          <section class="chats-contact__infos__media">
            <p
              v-if="lastMessage.isFromUser"
              class="chats-contact__infos__media__sender-prefix"
              data-testid="media-sender-prefix"
            >
              {{ $t('you_message_prefix') }}
            </p>
            <UnnnicIcon
              :icon="lastMessageMedia.mediaIcon"
              scheme="fg-base"
              size="sm"
            />
            <p
              :title="lastMessageMedia.mediaText"
              class="ellipsis"
            >
              {{ lastMessageMedia.mediaText }}
            </p>
          </section>
        </template>
        <p
          v-else-if="subtitle"
          class="ellipsis subtitle"
          :title="subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>
    <section
      v-if="!checkboxWhenSelect"
      class="chats-contact__infos__unread-messages-container"
      :class="{
        'chats-contact__infos__unread-messages-container--new-message-centered':
          isNewMessageIndicatorCentered,
      }"
    >
      <p
        v-if="lastInteractionTime"
        :class="{
          'chats-contact__infos__message-time': true,
          'chats-contact__infos__message-time--active': unreadMessages,
        }"
        data-testid="last-interaction-time"
      >
        {{ `${lastInteractionTimePrefix} ${formattedLastInteraction}`.trim() }}
      </p>
      <section
        class="chats-contact__infos__unread-messages-container__pin-container"
      >
        <UnnnicToolTip
          v-if="pendingResponse"
          class="chats-contact__infos__pending-response"
          :enabled="!!pendingResponseTooltip"
          :text="pendingResponseTooltip"
          side="top"
        >
          <UnnnicIcon
            icon="reply"
            size="sm"
            scheme="fg-info"
            data-testid="pending-response-icon"
          />
        </UnnnicToolTip>
        <button
          v-if="isRenderPin"
          data-testid="pin-button"
          class="chats-contact__infos__unread-messages-container__pin"
          type="button"
          @click.stop.prevent="handlePinClick"
          @mousedown.stop.prevent="handlePinMouseDown"
        >
          <UnnnicIcon
            data-testid="pin-icon"
            :icon="isUnpinned ? 'unpin' : 'pin'"
            size="ant"
            :scheme="schemePin"
          />
        </button>
        <UnnnicTooltip
          v-else-if="newMessageIndicator"
          class="chats-contact__infos__new-message-indicator-tooltip"
          :enabled="!!newMessageIndicatorTooltip"
          :text="newMessageIndicatorTooltip"
          side="top"
        >
          <span
            class="chats-contact__infos__new-message-indicator"
            data-testid="new-message-indicator"
          />
        </UnnnicTooltip>
        <p
          v-else-if="(unreadMessages && !selected) || forceShowUnreadMessages"
          class="chats-contact__infos__unread-messages"
          :title="$t('unread_messages', unreadMessages, { unreadMessages })"
        >
          {{ unreadMessages }}
        </p>
      </section>
    </section>
    <UnnnicCheckbox
      v-else-if="selected && checkboxWhenSelect"
      class="chats-contact__infos__checkbox"
      :modelValue="true"
    />

    <div
      class="chats-contact__ripples"
      aria-hidden="true"
    >
      <span
        v-for="ripple in ripples"
        :key="ripple.id"
        class="chats-contact__ripple"
        :style="{
          left: `${ripple.left}px`,
          top: `${ripple.top}px`,
          width: `${ripple.size}px`,
          height: `${ripple.size}px`,
        }"
      />
    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'ChatsContact',

  props: {
    title: {
      type: String,
      default: '',
    },
    lastMessage: {
      type: Object,
      default: () => ({}),
    },
    lastInteractionTimePrefix: {
      type: String,
      default: '',
    },
    lastInteractionTime: {
      type: String,
      default: '',
    },
    userPhoto: {
      type: String,
      default: '',
    },
    waitingTime: {
      type: Number,
      default: 0,
    },
    unreadMessages: {
      type: Number,
      default: 0,
    },
    forceShowUnreadMessages: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    checkboxWhenSelect: {
      type: Boolean,
      default: false,
    },
    discussionGoal: {
      type: String,
      default: '',
    },
    projectName: {
      type: String,
      default: '',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    activePin: {
      type: Boolean,
      default: false,
    },
    schemePin: {
      type: String,
      default: 'fg-emphasized',
    },
    pendingResponse: {
      type: Boolean,
      default: false,
    },
    pendingResponseTooltip: {
      type: String,
      default: '',
    },
    newMessageIndicator: {
      type: Boolean,
      default: false,
    },
    newMessageIndicatorTooltip: {
      type: String,
      default: '',
    },
  },

  emits: ['click', 'clickPin'],

  data() {
    return {
      isHovered: false,
      ripples: [],
    };
  },

  computed: {
    isNewMessageIndicatorCentered() {
      return this.newMessageIndicator && !this.lastInteractionTime;
    },
    messageInfoAlign() {
      if (this.isNewMessageIndicatorCentered) return 'center';
      if (this.newMessageIndicator) return 'space-between';
      return this.unreadMessages && this.selected ? 'center' : 'flex-start';
    },
    messageInfoMarginTop() {
      return this.unreadMessages && this.selected ? '0px' : '4px';
    },
    formattedLastInteraction() {
      if (!this.lastInteractionTime) return '';

      moment.locale(this.$i18n.locale);

      const now = moment();

      const lastInteractionMoment = moment(this.lastInteractionTime);

      if (now.subtract(1, 'day').isSame(lastInteractionMoment, 'day')) {
        return this.$t('yesterday');
      }

      if (now.diff(lastInteractionMoment, 'hours') > 0) {
        return lastInteractionMoment.format('L');
      }

      return lastInteractionMoment.format('HH:mm');
    },

    lastMessageMedia() {
      const { lastMessage } = this;

      const isMedia =
        typeof lastMessage === 'object' && lastMessage?.media?.[0];

      if (!isMedia) return { isMedia };

      const contentType =
        lastMessage?.media?.[0]?.content_type?.split('/')?.[0];

      const mediaIconMapper = {
        audio: 'mic',
        image: 'image',
        video: 'videocam',
        application: 'article',
        geo: 'location_on',
      };

      const mediaIcon = mediaIconMapper[contentType];

      const mediaTextMapper = {
        audio: this.$t('audio'),
        image: this.$t('image'),
        video: this.$t('video'),
        application: lastMessage.media[0].url.split('/').at(-1),
        geo: lastMessage.text,
      };

      const mediaText = mediaTextMapper[contentType];

      return { isMedia, contentType, lastMessage, mediaIcon, mediaText };
    },
    contactName() {
      return this.title?.trim() || `[${this.$t('unnamed_contact')}]`;
    },
    subtitle() {
      const { discussionGoal, lastMessage } = this;
      return discussionGoal
        ? this.$t('discussion_about', { discussionGoal })
        : lastMessage?.text;
    },
    isUnpinned() {
      return this.pinned && this.isHovered;
    },
    isRenderPin() {
      const isHover = this.isHovered;
      return (this.activePin && isHover) || this.pinned;
    },
  },

  created() {
    this._rippleTimeouts = [];
  },

  beforeUnmount() {
    this._rippleTimeouts.forEach((id) => clearTimeout(id));
    this._rippleTimeouts = [];
  },

  methods: {
    handleRippleMouseDown(event) {
      if (this.disabled) return;

      const el = this.$refs.rootEl;

      if (!el || !(el instanceof Element)) return;

      const { left, top, width, height } = el.getBoundingClientRect();
      const size = Math.max(width, height);
      const half = size / 2;
      const id = `${Date.now()}-${Math.random()}`;

      this.ripples.push({
        id,
        left: event.clientX - left - half,
        top: event.clientY - top - half,
        size,
      });

      const timeoutId = window.setTimeout(() => {
        const idx = this._rippleTimeouts.indexOf(timeoutId);
        if (idx !== -1) {
          this._rippleTimeouts.splice(idx, 1);
        }
        this.ripples = this.ripples.filter((r) => r.id !== id);
      }, 1000);

      this._rippleTimeouts.push(timeoutId);
    },

    handleContactClick(event) {
      this.$emit('click', event);
    },

    handleContactKeypress() {
      this.$emit('click');
    },

    handlePinClick(event) {
      event.stopPropagation();
      event.preventDefault();

      this.$emit('clickPin', this.isUnpinned ? 'unpin' : 'pin');
    },

    handlePinMouseDown(event) {
      event.stopPropagation();
      event.preventDefault();
    },
  },
};
</script>

<style lang="scss" scoped>
.chats-contact {
  position: relative;
  overflow: hidden;

  display: grid;
  grid-template-columns: max-content 1fr min-content;
  align-items: center;
  gap: $unnnic-spacing-xs;

  background-color: $unnnic-color-bg-base;

  border: 1px solid $unnnic-color-border-base;

  font-family: $unnnic-font-family-secondary;

  padding: $unnnic-spacing-xs;

  cursor: pointer;

  &:active {
    border: 1px solid $unnnic-color-border-emphasized;
  }

  &:focus-visible {
    outline-color: $unnnic-color-weni-600;
    outline-style: solid;
    outline-width: 1px;
  }

  * {
    margin: 0;
  }

  &.selected {
    background-color: $unnnic-color-bg-base-soft;
    border: 1px solid $unnnic-color-border-base;
  }

  &.waiting {
    background-color: $unnnic-color-bg-base-soft;

    &:hover {
      background-color: $unnnic-color-bg-base-soft;
    }

    .chats-contact__infos__unread-messages {
      background: $unnnic-color-bg-base;
    }
  }

  &.unread-messages {
    .title {
      color: $unnnic-color-fg-emphasized;
      font-weight: $unnnic-font-weight-bold;
    }

    .additional-information {
      color: $unnnic-color-fg-base;
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &.disabled {
    .content {
      .title {
        color: $unnnic-color-fg-muted;
        font-weight: $unnnic-font-weight-bold;
      }

      .additional-information {
        color: $unnnic-color-gray-1;
      }
    }

    .unread-messages {
      color: $unnnic-color-fg-muted;
    }
  }

  &:hover,
  &.selected:hover {
    background-color: $unnnic-color-bg-base-soft;

    .chats-contact__infos {
      &__unread-messages {
        background: $unnnic-color-bg-base;
      }
    }
  }

  &__discussion-icon {
    width: $unnnic-icon-size-xl;
    height: $unnnic-icon-size-xl;

    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $unnnic-border-radius-sm;

    background-color: $unnnic-color-purple-10;
  }

  &__infos {
    margin-right: auto;

    display: flex;
    flex-flow: column wrap;

    width: 100%;
    overflow: hidden;
    gap: $unnnic-spacing-nano;

    &__title-container {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-xs;
      justify-content: flex-start;
      white-space: nowrap;
      width: 100%;
    }

    &__project-tag {
      display: block;
      flex-shrink: 1;
      background: $unnnic-color-bg-muted;

      font: $unnnic-font-caption-1;
      color: $unnnic-color-fg-emphasized;

      border-radius: $unnnic-radius-full;
      padding: $unnnic-space-05 $unnnic-space-3;
    }

    &__media {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-nano;

      &__sender-prefix {
        color: $unnnic-color-fg-base;
      }
    }

    &__title,
    &__additional-information {
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-medium;
    }

    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-fg-emphasized;
    }

    &__additional-information {
      width: 100%; // important to ellipsis work

      color: $unnnic-color-fg-base;
    }

    &__pending-response {
      display: flex;
      align-items: center;
    }

    &__unread-messages-container {
      height: 100%;
      min-width: max-content;
      display: flex;
      flex-direction: column;
      align-items: end;
      justify-content: v-bind(messageInfoAlign);
      gap: $unnnic-spacing-nano;
      margin-top: v-bind(messageInfoMarginTop);

      &--new-message-centered {
        justify-content: center;
      }

      &__pin-container {
        display: flex;
        align-items: center;
        gap: $unnnic-space-1;
        position: relative;
        z-index: 10;
      }

      &__pin {
        max-width: $unnnic-icon-size-ant;
        max-height: $unnnic-icon-size-ant;
        cursor: pointer;
        position: relative;
        z-index: 10;

        border: none;
        background: none;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        text-decoration: none;
        outline: none;

        :deep(*) {
          pointer-events: none;
          cursor: pointer;
        }
      }
    }

    &__message-time {
      color: $unnnic-color-fg-base;
      font-family: $unnnic-font-family-secondary;
      font-size: 10px;
      line-height: $unnnic-font-size-body-lg;

      &--active {
        color: $unnnic-color-fg-info;
        font-weight: $unnnic-font-weight-bold;
      }
    }

    &__unread-messages {
      display: flex;
      justify-content: center;
      align-items: center;

      border-radius: 50%;
      background: $unnnic-color-bg-info;

      width: 1.25rem;
      min-width: 1.25rem;
      height: 1.25rem;

      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-bold;
      line-height: $unnnic-line-height-small;
      color: $unnnic-color-fg-info;
    }

    &__new-message-indicator {
      display: flex;
      justify-content: center;
      align-items: center;

      width: $unnnic-space-5;
      min-width: $unnnic-space-5;
      height: $unnnic-space-5;

      &::before {
        content: '';
        display: block;

        width: $unnnic-space-2;
        height: $unnnic-space-2;

        border-radius: 50%;
        background-color: $unnnic-color-bg-blue-strong;
      }
    }

    .ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bold {
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &__ripples {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  &__ripple {
    position: absolute;
    border-radius: 50%;
    background-color: $unnnic-color-fg-muted;
    opacity: 0.12;
    transform: scale(0);
    animation: chats-contact-ripple-grow 1s ease-out forwards;
  }
}

@keyframes chats-contact-ripple-grow {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
