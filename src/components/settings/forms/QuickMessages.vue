<template>
  <section class="form-quick-messages">
    <section class="form-queue__queues">
      <list-sector-quick-messages :sector="sector.name" :quick_messages="quick_messages" />
    </section>
  </section>
</template>

<script>
import ListSectorQuickMessages from '@/components/settings/lists/ListSectorQuickMessages';

export default {
  name: 'FormQuickMessages',

  components: {
    ListSectorQuickMessages,
  },

  props: {
    quick_messages: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    tag: '',
  }),

  computed: {
    tags: {
      get() {
        return this.value;
      },
      set(tags) {
        this.$emit('input', tags);
      },
    },
  },

  methods: {},
};
</script>

<style lang="scss" scoped>
.form-quick-messages {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-md;

  &__description {
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-cloudy;
  }

  &__section {
    &__label {
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      margin-bottom: $unnnic-spacing-inline-sm;
    }

    &__input-group {
      display: flex;
      align-items: flex-end;
      gap: $unnnic-spacing-stack-sm;

      &__input {
        flex: 1 1;
      }
    }
  }
}
</style>
