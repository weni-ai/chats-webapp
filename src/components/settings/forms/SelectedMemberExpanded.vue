<template>
  <section class="selected-member-expanded">
    <section class="selected-member-expanded__header">
      <section
        class="selected-member-expanded__header-title"
        @click="toggleOpen"
      >
        <UnnnicIcon
          :icon="localOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        />
        <p class="selected-member-expanded__header-agent-name">
          {{ agentName }}
        </p>
        <p class="selected-member-expanded__header-email">
          {{ agentEmail }}
        </p>
      </section>
      <UnnnicIcon
        icon="close"
        clickable
        scheme="neutral-cloudy"
        @click="removeAgent"
      />
    </section>
    <section
      v-if="localOpen"
      class="selected-member-expanded__body"
    >
      <p class="selected-member-expanded__body-description">
        {{
          $t('config_chats.groups.agents_form.define_queues', {
            agentName,
          })
        }}
      </p>
      <TagGroup
        style="margin-top: 16px"
        :modelValue="agentQueues"
        :tags="queuesOptions"
        selectable
        flex
        @update:model-value="updateQueues"
      />
    </section>
  </section>
</template>

<script>
import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'SelectedMemberExpanded',
  components: {
    TagGroup,
  },
  props: {
    agentName: {
      type: String,
      default: '',
    },
    agentEmail: {
      type: String,
      required: true,
    },
    agentQueues: {
      type: Array,
      default: () => [],
    },
    open: {
      type: Boolean,
      default: false,
    },
    queuesOptions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['remove', 'update:open', 'update:agentQueues'],
  data() {
    return {
      localOpen: false,
      selectedQueues: [],
    };
  },
  watch: {
    open: {
      handler(open) {
        this.localOpen = open;
      },
      immediate: true,
    },
    localOpen: {
      handler(open) {
        this.$emit('update:open', open);
      },
    },
  },
  methods: {
    toggleOpen() {
      this.localOpen = !this.localOpen;
    },
    removeAgent() {
      this.$emit('remove');
    },
    updateQueues(queues) {
      this.$emit('update:agentQueues', queues);
    },
  },
};
</script>

<style lang="scss" scoped>
.selected-member-expanded {
  display: flex;
  flex-direction: column;
  padding: $unnnic-spacing-sm;
  gap: $unnnic-spacing-sm;
  border: 1px solid $unnnic-color-neutral-soft;
  border-radius: $unnnic-border-radius-sm;

  &__header {
    display: flex;
    justify-content: space-between;
    gap: $unnnic-spacing-sm;
    cursor: pointer;

    &-title {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-sm;
      width: 100%;
    }

    &-agent-name {
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-font-size-body-lg + $unnnic-line-height-medium;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-darkest;
    }

    &-email {
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-font-size-body-lg + $unnnic-line-height-medium;
      font-weight: $unnnic-font-weight-regular;
      color: $unnnic-color-neutral-darkest;
    }
  }
}
</style>
