<template>
  <UnnnicModal
    data-testid="modal-bulk-transfer"
    :text="$t('bulk_transfer.transfer_selected_contacts')"
    class="modal-bulk-transfer"
    :closeIcon="false"
  >
    <main class="modal-bulk-transfer__select-destination">
      <section class="select-destination__field">
        <UnnnicLabel :label="$t('queue')" />
        <UnnnicSelectSmart
          data-testid="select-queue"
          v-model="selectedQueue"
          :options="queues"
          autocomplete
          autocompleteIconLeft
          autocompleteClearOnFocus
        />
      </section>
      <section class="select-destination__field">
        <UnnnicLabel :label="$t('agent')" />
        <UnnnicSelectSmart
          data-testid="select-agent"
          v-model="selectedAgent"
          :disabled="isAgentsFieldDisabled"
          :options="agents"
          autocomplete
          autocompleteIconLeft
          autocompleteClearOnFocus
        />
      </section>
    </main>

    <template #options>
      <UnnnicButton
        data-testid="cancel-button"
        :text="$t('cancel')"
        type="tertiary"
        size="large"
        @click="$emit('close')"
      />
      <UnnnicButton
        data-testid="transfer-button"
        :text="$t('transfer')"
        type="primary"
        size="large"
        @click="bulkTransfer"
        :disabled="selectedQueue.length === 0"
        :loading="isLoadingBulkTransfer"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import Room from '@/services/api/resources/chats/room';
import { mapState } from 'vuex';
import Queue from '@/services/api/resources/settings/queue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

export default {
  name: 'ModalBulkTransfer',

  data() {
    return {
      queues: [],
      selectedQueue: [],
      agents: [],
      selectedAgent: [],

      isLoadingBulkTransfer: false,
    };
  },

  created() {
    this.getQueues();
    this.queues = this.queuesDefault;
    this.agents = this.agentsDefault;
  },

  computed: {
    ...mapState({
      selectedRoomsToTransfer: (state) =>
        state.chats.rooms.selectedRoomsToTransfer,
    }),

    queuesDefault() {
      return [{ value: '', label: this.$t('select_queue') }];
    },
    agentsDefault() {
      return [{ value: '', label: this.$t('select_agent') }];
    },

    isAgentsFieldDisabled() {
      return this.selectedQueue[0]?.value === '' || this.agents?.length < 2;
    },
  },

  methods: {
    async getQueues() {
      const newQueues = await Queue.listByProject();

      const treatedQueues = newQueues.results.map(
        ({ name, sector_name, uuid }) => ({
          queue_name: name,
          label: `${name} | ${this.$t('sector.title')} ${sector_name}`,
          value: uuid,
        }),
      );

      this.queues = [...this.queuesDefault, ...treatedQueues];
    },

    async getAgents(queueUuid) {
      const newAgents = await Queue.agentsToTransfer(queueUuid);

      const treatedAgents = newAgents
        .filter((agent) => agent.email !== this.$store.state.profile.me.email)
        .map(({ first_name, last_name, email }) => ({
          label: [first_name, last_name].join(' ').trim() || email,
          value: email,
        }));

      this.agents = [...this.agentsDefault, ...treatedAgents];
    },
    async bulkTransfer() {
      const { selectedRoomsToTransfer } = this;
      const selectedQueue = this.selectedQueue?.[0]?.value;
      const selectedAgent = this.selectedAgent?.[0]?.value;

      this.isLoadingBulkTransfer = true;

      const response = await Room.bulkTranfer({
        rooms: selectedRoomsToTransfer,
        intended_queue: selectedQueue,
        intended_agent: selectedAgent,
      });

      response.status === 200 ? this.callSuccessAlert() : this.callErrorAlert();
      this.isLoadingBulkTransfer = false;
      this.$emit('close');
    },

    callSuccessAlert() {
      const selectedAgent = this.selectedAgent?.[0]?.label;
      const successTranslation = `bulk_transfer.${
        selectedAgent ? 'agent_transfer_success' : 'queue_transfer_success'
      }`;
      const destination = selectedAgent || this.selectedQueue?.[0].queue_name;

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
    selectedQueue(newSelectedQueue) {
      const queue = newSelectedQueue[0]?.value;
      if (queue) {
        this.getAgents(queue);
      }
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
    &__field {
      text-align: initial;
    }
  }
}
</style>
