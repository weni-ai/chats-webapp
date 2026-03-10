<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-closed-chats-filters"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('search') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-closed-chats-filters__content">
        <RoomsTableFilters
          v-model="localFilters"
          vertically
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          type="primary"
          :text="$t('search')"
          @click="emitFilters"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import RoomsTableFilters from '@/views/chats/ClosedChats/RoomsTableFilters.vue';

export default {
  name: 'ModalClosedChatsFilters',
  components: {
    RoomsTableFilters,
  },

  props: {
    filters: {
      type: Object,
      default: () => {},
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['inputFilters', 'update:modelValue'],

  data() {
    return {
      localFilters: this.filters,
    };
  },

  computed: {
    isOpen: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },

  methods: {
    emitFilters() {
      this.$emit('inputFilters', this.localFilters);
      this.isOpen = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-closed-chats-filters {
  &__content {
    padding: $unnnic-space-6;
  }

  &--closed {
    width: 0;
  }
}
</style>
