<template>
  <UnnnicModal
    :text="$t('bulk_transfer.transfer_selected_contacts')"
    class="modal-bulk-transfer"
  >
    <section>
      <UnnnicSelectSmart
        v-model="selectedDestination"
        :options="destinations"
        autocomplete
        autocompleteIconLeft
        autocompleteClearOnFocus
      />
    </section>

    <template #options>
      <UnnnicButton
        :text="$t('cancel')"
        type="secondary"
        size="large"
        @click="$emit('close')"
      />
      <UnnnicButton
        :text="$t('confirm')"
        type="primary"
        size="large"
        @click="bulkTransfer"
        :disabled="selectedDestination.length === 0"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import Room from '@/services/api/resources/chats/room';
import { mapState } from 'vuex';
export default {
  data() {
    return {
      selectedDestination: [],
      destinations: [],
    };
  },

  computed: {
    ...mapState({
      selectedRoomsToTransfer: (state) =>
        state.chats.rooms.selectedRoomsToTransfer,
    }),
  },

  methods: {
    bulkTransfer() {
      Room.bulkTranfer({ rooms: this.selectedRoomsToTransfer });
    },
  },
};
</script>

<style></style>
