<template>
  <UnnnicModal
    :text="$t('bulk_transfer.transfer_selected_contacts')"
    class="modal-bulk-transfer"
    :closeIcon="false"
  >
    <section class="modal-bulk-transfer__select-destination">
      <section class="select-destination__radios">
        <UnnnicRadio
          size="md"
          v-model="destinationType"
          value="agent"
        >
          {{ $t('agent') }}
        </UnnnicRadio>

        <UnnnicRadio
          size="md"
          v-model="destinationType"
          value="queue"
        >
          {{ $t('queue') }}
        </UnnnicRadio>
      </section>
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
        type="tertiary"
        size="large"
        @click="$emit('close')"
      />
      <UnnnicButton
        :text="$t('confirm')"
        type="primary"
        size="large"
        @click="bulkTransfer"
        :disabled="selectedDestination.length === 0"
        :loading="isLoadingBulkTransfer"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import Room from '@/services/api/resources/chats/room';
import { mapState } from 'vuex';
// import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

export default {
  name: 'ModalBulkTransfer',

  data() {
    return {
      selectedDestination: [],
      destinationType: 'agent',
      destinations: [],
      queues: null,
      agents: null,

      isLoadingBulkTransfer: false,
    };
  },

  created() {
    this.getDestinations();
  },

  computed: {
    ...mapState({
      selectedRoomsToTransfer: (state) =>
        state.chats.rooms.selectedRoomsToTransfer,
    }),
  },

  methods: {
    async getDestinations() {
      const newQueues = await Queue.listByProject();

      const treatedQueues = [{ value: '', label: this.$t('select_queue') }];
      treatedQueues
        .concat(newQueues.results)
        .forEach(({ name, sector_name, uuid }) => {
          treatedQueues.push({
            queue_name: name,
            label: `${name} | ${this.$t('sector.title')} ${sector_name}`,
            value: uuid,
          });
        });
      this.queues = treatedQueues;
    },

    // async listAgents() {
    //   this.agents = (
    //     await Sector.agents({ sectorUuid: this.room.queue.sector })
    //   )
    //     .filter((agent) => agent.email !== this.$store.state.profile.me.email)
    //     .map(({ first_name, last_name, email }) => {
    //       return {
    //         name: [first_name, last_name].join(' ').trim() || email,
    //         email,
    //       };
    //     });
    // },
    async bulkTransfer() {
      const { destinationType, selectedRoomsToTransfer } = this;
      const destination = this.selectedDestination?.[0]?.value;
      const destinationProperty =
        destinationType === 'queue' ? 'intended_queue' : 'intended_agent';

      this.isLoadingBulkTransfer = true;

      const response = await Room.bulkTranfer({
        rooms: selectedRoomsToTransfer,
        [destinationProperty]: destination,
      });

      response.status === 200 ? this.callSuccessAlert() : this.callErrorAlert();
      this.isLoadingBulkTransfer = false;
      this.$emit('close');
    },

    callSuccessAlert() {
      const successTranslation = `bulk_transfer.${
        this.destinationType === 'agent'
          ? 'agent_transfer_success'
          : 'queue_transfer_success'
      }`;
      const destination = this.selectedDestination?.[0].queue_name;

      this.getAlert({
        text: this.$t(successTranslation, {
          queue: destination,
          agent: destination,
        }),
        type: 'success',
      });
    },

    callErrorAlert() {
      this.getAlert({
        text: this.$t('bulk_transfer.error'),
        type: 'error',
      });
    },

    getAlert({ text, type }) {
      callUnnnicAlert({
        props: { text, type },
        seconds: 5,
      });
    },
  },

  watch: {
    destinationType(newDestinationType) {
      const { queues, agents } = this;
      this.destinations = newDestinationType === 'queue' ? queues : agents;
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-bulk-transfer {
  :deep(.unnnic-modal-container-background) {
    overflow: visible;

    .unnnic-modal-container-background-body {
      padding-top: $unnnic-spacing-giant;

      &-description-container {
        padding-bottom: 0;
      }

      &-description,
      &-description-container {
        overflow: visible;
      }
    }
  }

  &__select-destination {
    display: grid;
    gap: $unnnic-spacing-sm;
  }

  .select-destination {
    &__radios {
      display: flex;
      gap: $unnnic-spacing-sm;
    }
  }
}
</style>
