<template>
  <main
    class="rooms-transfer__select-destination"
    :class="{ small: size === 'sm' }"
  >
    <section class="select-destination__field">
      <UnnnicLabel
        v-if="size !== 'sm'"
        :label="$t('queue')"
      />
      <UnnnicSelectSmart
        data-testid="select-queue"
        v-model="selectedQueue"
        :size="size"
        :options="queues"
        autocomplete
        :autocompleteIconLeft="size !== 'sm'"
        autocompleteClearOnFocus
      />
    </section>
    <section class="select-destination__field">
      <UnnnicLabel
        v-if="size !== 'sm'"
        :label="$t('agent')"
      />
      <UnnnicSelectSmart
        data-testid="select-agent"
        v-model="selectedAgent"
        :size="size"
        :disabled="isAgentsFieldDisabled"
        :options="agents"
        autocomplete
        autocompleteIconLeft
        autocompleteClearOnFocus
      />
    </section>
  </main>
</template>

<script>
import isMobile from 'is-mobile';

import Room from '@/services/api/resources/chats/room';

import { mapActions, mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';

import Queue from '@/services/api/resources/settings/queue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
export default {
  name: 'RoomsTransferFields',

  props: {
    size: {
      type: String,
      default: 'md',
      validator(value) {
        return ['sm', 'md'].includes(value);
      },
    },
    bulkTransfer: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      isMobile: isMobile(),

      queues: [],
      selectedQueue: [],
      agents: [],
      selectedAgent: [],
    };
  },

  created() {
    this.getQueues();
    this.queues = this.queuesDefault;
    this.agents = this.agentsDefault;
  },

  computed: {
    ...mapState(useRooms, ['selectedRoomsToTransfer', 'contactToTransfer']),
    ...mapState(useProfile, ['me']),

    queuesDefault() {
      return [{ value: '', label: this.$t('select_queue') }];
    },
    agentsDefault() {
      return [{ value: '', label: this.$t('select_agent') }];
    },
    roomsToTransfer() {
      return this.bulkTransfer
        ? this.selectedRoomsToTransfer
        : [this.contactToTransfer];
    },

    isAgentsFieldDisabled() {
      return this.selectedQueue[0]?.value === '' || this.agents?.length < 2;
    },
  },

  methods: {
    ...mapActions(useRooms, [
      'setSelectedRoomsToTransfer',
      'setContactToTransfer',
    ]),

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
        .filter((agent) => agent.email !== this.me.email)
        .map(({ first_name, last_name, email }) => ({
          label: [first_name, last_name].join(' ').trim() || email,
          value: email,
        }));

      this.agents = [...this.agentsDefault, ...treatedAgents];
    },

    /**
     * Performs a bulk transfer of selected rooms to a specific queue or agent.
     * This function must be associated with an appropriate event.
     *
     * @returns {Promise<void>} A promise that resolves when the bulk transfer is complete.
     */
    async transfer() {
      const { roomsToTransfer } = this;
      const selectedQueue = this.selectedQueue?.[0]?.value;
      const selectedAgent = this.selectedAgent?.[0]?.value;

      try {
        const response = await Room.bulkTranfer({
          rooms: roomsToTransfer,
          intended_queue: selectedQueue,
          intended_agent: selectedAgent,
        });

        if (response.status === 200) {
          this.transferSuccess();
          this.resetRoomsToTransfer();
        } else {
          this.transferError();
        }
      } catch (error) {
        console.error(
          'An error occurred while performing the mass transfer:',
          error,
        );
        this.transferError();
      }
    },

    resetRoomsToTransfer() {
      this.setSelectedRoomsToTransfer([]);
      this.setContactToTransfer('');
    },

    transferSuccess() {
      this.$emit('transfer-complete', 'success');
      this.callSuccessAlert();
    },
    transferError() {
      this.$emit('transfer-complete', 'error');
      this.callErrorAlert();
    },

    callSuccessAlert() {
      const selectedAgent = this.selectedAgent?.[0]?.label;
      const successTranslation = `bulk_transfer.${
        selectedAgent ? 'agent_transfer_success' : 'queue_transfer_success'
      }`;
      const destination = selectedAgent || this.selectedQueue?.[0].queue_name;

      this.getAlert({
        text: this.$tc(successTranslation, this.roomsToTransfer.length, {
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
      if (!this.isMobile) {
        callUnnnicAlert({
          props: { text, type },
          seconds: 5,
        });
      }
    },
  },

  watch: {
    selectedQueue(newSelectedQueue) {
      this.$emit('update:selectedQueue', newSelectedQueue);

      const queue = newSelectedQueue[0]?.value;
      if (queue) {
        this.getAgents(queue);
      }
    },
    selectedAgent(newSelectedAgent) {
      this.$emit('update:selectedAgent', newSelectedAgent);
    },
  },
};
</script>

<style lang="scss" scoped>
.rooms-transfer {
  &__select-destination {
    display: grid;
    gap: $unnnic-spacing-sm;

    &.small {
      gap: $unnnic-spacing-nano;
    }

    .select-destination {
      &__field {
        text-align: left;
      }
    }
  }
}
</style>
