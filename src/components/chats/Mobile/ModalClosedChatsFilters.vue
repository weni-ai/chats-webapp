<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicModal
    ref="refModalClosedChatsFilters"
    class="modal-closed-chats-filters"
    :text="$t('search')"
    @close="$emit('close')"
  >
    <RoomsTableFilters
      v-model="filters"
      vertically
    />

    <template #options>
      <UnnnicButton
        type="primary"
        :text="$t('search')"
        @click="emitFilters"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import RoomsTableFilters from '@/views/chats/ClosedChats/RoomsTableFilters.vue';

export default {
  name: 'ModalClosedChatsFilters',
  components: {
    RoomsTableFilters,
  },

  props: {
    value: {
      type: Object,
      default: null,
    },
    showModal: {
      type: Boolean,
    },
  },
  emits: ['close', 'input'],

  data() {
    return {
      filters: this.value,
    };
  },
  methods: {
    emitFilters() {
      this.$emit('input', this.filters);
      this.closeModalInternally();
    },
    closeModalInternally() {
      this.$refs.refModalClosedChatsFilters?.onCloseClick();
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-closed-chats-filters {
  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background-body {
      &-description {
        padding: 0;

        &-container {
          padding-bottom: 0;
        }
      }
    }
  }
  &--closed {
    width: 0;
  }
}
</style>
