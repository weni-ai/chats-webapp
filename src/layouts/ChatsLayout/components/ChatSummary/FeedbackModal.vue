<template>
  <UnnnicModalDialog
    class="summary-feedback-modal"
    :modelValue="true"
    :title="$t('chats.summary.feedback.title')"
    showCloseIcon
    :primaryButtonProps="{
      text: $t('submit'),
      loading: isLoading,
      disabled: disableSubmit,
    }"
    data-testid="feedback-modal"
    @primary-button-click="handleSubmit"
    @update:model-value="handleCancel"
  >
    <section class="summary-feedback-modal__content">
      <TagGroup
        v-model="feedbackSelectedCategory"
        :tags="feedbackCategories"
        selectable
      />
      <section
        v-if="!hasFeedback"
        class="summary-feedback-modal__rating"
      >
        <UnnnicToolTip
          enabled
          :text="$t('chats.summary.feedback.positive')"
          side="left"
        >
          <UnnnicIcon
            icon="thumb_up"
            :filled="activeRoomSummary.feedback?.liked === true"
            size="md"
            clickable
            scheme="neutral-dark"
            data-testid="feedback-like"
            @click="handleLike(true)"
          />
        </UnnnicToolTip>
        <UnnnicToolTip
          enabled
          :text="$t('chats.summary.feedback.negative')"
          side="left"
        >
          <UnnnicIcon
            icon="thumb_down"
            :filled="activeRoomSummary.feedback?.liked === false"
            size="md"
            clickable
            scheme="neutral-dark"
            data-testid="feedback-dislike"
            @click="handleLike(false)"
          />
        </UnnnicToolTip>
      </section>
      <UnnnicTextArea
        v-if="activeRoomSummary.feedback?.liked === false"
        v-model="feedbackText"
        :placeholder="$t('chats.summary.feedback.placeholder')"
        :label="$t('other')"
        :maxLength="150"
        data-testid="feedback-textarea"
      />
    </section>
  </UnnnicModalDialog>
</template>

<script>
import { mapWritableState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

import TagGroup from '@/components/TagGroup.vue';

import Room from '@/services/api/resources/chats/room';

import { unnnicCallAlert } from '@weni/unnnic-system';

export default {
  name: 'FeedbackModal',
  components: {
    TagGroup,
  },
  props: {
    hasFeedback: {
      type: Boolean,
      default: false,
    },
    roomUuid: {
      type: String,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      feedbackText: '',
      initialFeedback: null,
      isLoading: false,
      feedbackCategories: [],
      feedbackSelectedCategory: [],
    };
  },
  computed: {
    ...mapWritableState(useRooms, [
      'activeRoomSummary',
      'roomsSummary',
      'activeRoom',
    ]),
    disableSubmit() {
      return (
        this.activeRoomSummary.feedback.liked === null ||
        (this.feedbackSelectedCategory.length === 0 &&
          this.feedbackText.length === 0)
      );
    },
  },
  watch: {
    '$i18n.locale': {
      handler() {
        this.getFeedbackCategory();
      },
    },
  },
  mounted() {
    this.initialFeedback = JSON.parse(JSON.stringify(this.activeRoomSummary));
    this.getFeedbackCategory();
  },
  methods: {
    async getFeedbackCategory() {
      const { results } = await Room.getSummaryFeedbackTags();
      this.feedbackCategories = Object.entries(results).map(([key, value]) => ({
        name: value,
        uuid: key,
      }));
    },
    handleLike(liked) {
      this.activeRoomSummary.feedback.liked = liked;
    },
    handleCancel() {
      this.roomsSummary[this.activeRoom.uuid] = {
        ...this.initialFeedback,
        feedback: {
          liked: null,
        },
      };
      this.$emit('close');
    },
    async handleSubmit() {
      this.isLoading = true;
      try {
        await Room.sendSummaryFeedback({
          roomUuid: this.roomUuid,
          liked: this.activeRoomSummary.feedback.liked,
          text: this.feedbackText,
          tags: this.feedbackSelectedCategory.map((category) => category.uuid),
        });
        unnnicCallAlert({
          props: {
            text: this.$t('chats.summary.feedback.sended'),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoading = false;
        this.$emit('close', { closeSummary: !this.hasFeedback });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.summary-feedback-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-md;
  }
  &__rating {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: $unnnic-spacing-md;
    gap: $unnnic-spacing-lg;
  }
}
</style>
