<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <unnnic-modal
    ref="refModalClosedChatsFilters"
    class="modal-closed-chats-filters"
    :text="$t('search')"
    @close="$emit('close')"
  >
    <rooms-table-filters @update-filters="filters = $event" vertically />

    <template #options>
      <unnnic-button type="primary" :text="$t('search')" @click="emitFilters" />
    </template>
  </unnnic-modal>
</template>

<script>
import RoomsTableFilters from '@/views/chats/ClosedChats/RoomsTableFilters.vue';

export default {
  name: 'ModalClosedChatsFilters',
  components: {
    RoomsTableFilters,
  },

  props: {
    showModal: {
      type: Boolean,
    },
  },

  data() {
    return {
      filters: null,
    };
  },
  methods: {
    emitFilters() {
      this.$emit('update-filters', this.filters);
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
