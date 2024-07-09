<template>
  <section class="form-queue">
    <!-- <p v-if="showInfoIcon" class="form-queue__description">{{ infoText }}</p> -->
    <p class="title">
      {{ label }}
      <UnnnicToolTip
        enabled
        side="right"
        :text="$t('new_sector.queues_tip')"
        maxWidth="23rem"
      >
        <UnnnicIconSvg
          icon="information-circle-4"
          scheme="neutral-soft"
          size="sm"
        />
      </UnnnicToolTip>
    </p>

    <section class="controls">
      <UnnnicInput
        v-model="queue.name"
        :label="$t('queues.queue_name')"
        :placeholder="$t('queues.queue_name_placeholder')"
        class="input"
      />
      <UnnnicButton
        v-if="isEditing"
        :text="$t('save')"
        type="secondary"
        @click="addQueue"
      />
    </section>

    <section
      v-if="isEditing"
      class="form-queue__queues"
    >
      <ListSectorQueues
        :sector="sector.name"
        :queues="queues"
        @visualize="visualize"
      />
    </section>
  </section>
</template>

<script>
import ListSectorQueues from '@/components/settings/lists/ListSectorQueues.vue';

export default {
  name: 'FormQueue',

  components: {
    ListSectorQueues,
  },

  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    queues: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    sector: {
      type: Object,
      default: () => ({}),
    },
    showInfoIcon: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ['update:modelValue', 'validate', 'visualize', 'add-queue'],

  data: () => ({
    description:
      'Por enquanto você não definiu uma mensagem automática, defina uma mensagem para seus contatos que estão aguardando',
    editContent: false,
    content: '',
  }),

  computed: {
    queue: {
      get() {
        return this.modelValue;
      },
      set(queue) {
        this.$emit('update:modelValue', queue);
      },
    },
  },

  watch: {
    queue: {
      deep: true,
      immediate: true,
      handler() {
        this.$emit('validate', this.validate());
      },
    },
  },

  methods: {
    focusTextEditor() {
      this.$nextTick(() => {
        this.$refs.textEditor?.focus();
      });
    },
    editDescription() {
      this.editContent = true;
      // this.focusTextEditor();
    },
    cancelEditDescription() {
      this.editContent = false;
    },
    visualize(queue) {
      this.$emit('visualize', queue);
    },
    addQueue() {
      this.$emit('add-queue', this.queue);
    },
    validate() {
      return !!this.queue.name;
    },
  },
};
</script>

<style lang="scss" scoped>
.form-queue {
  &__description {
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
    margin: $unnnic-spacing-inline-xs 0 $unnnic-spacing-inline-md;
  }

  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-stack-sm;
    margin-bottom: 1.5rem;

    .input {
      flex: 1 1;

      margin-top: -0.5rem;
    }
  }
}
</style>
