<template>
  <main
    class="rooms-transfer__select-destination"
    :class="{ small: size === 'sm' }"
  >
    <section class="select-destination__field">
      <UnnnicSelect
        v-model="selectedQueueOption"
        data-testid="select-queue"
        :size="size"
        :options="queues"
        :label="size !== 'sm' ? $t('queue') : undefined"
        :placeholder="$t('select_queue')"
        returnObject
        clearable
        enableSearch
        :search="searchQueue"
        @update:search="searchQueue = $event"
      />
    </section>
    <section class="select-destination__field">
      <UnnnicSelect
        v-model="selectedAgent"
        data-testid="select-agent"
        :size="size"
        :disabled="isAgentsFieldDisabled"
        :options="agents"
        :label="size !== 'sm' ? $t('agent') : undefined"
        :placeholder="$t('select_agent')"
        returnObject
        clearable
        enableSearch
        :search="searchAgent"
        @update:search="searchAgent = $event"
      />
    </section>
    <UnnnicDisclaimer
      v-if="showTransferDisclaimer"
      data-testid="transfer-disclaimer"
      :class="[
        'select-destination__disclaimer',
        { 'select-destination__disclaimer--small': size === 'sm' },
      ]"
      :description="transferDisclaimerText"
      type="error"
    />
    <UnnnicDisclaimer
      v-if="showTransferToOtherSectorDisclaimer"
      data-testid="transfer-other-queue-disclaimer"
      :class="[
        'select-destination__disclaimer',
        { 'select-destination__disclaimer--small': size === 'sm' },
      ]"
      :description="$t('bulk_transfer.disclaimer.transfer_to_other_sector')"
      type="attention"
    />
  </main>
</template>

<script>
import isMobile from 'is-mobile';

import Room from '@/services/api/resources/chats/room';

import { mapActions, mapState, mapWritableState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';

import Queue from '@/services/api/resources/settings/queue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

import i18n from '@/plugins/i18n';

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
    modelValue: {
      type: Array,
      required: true,
    },
    fixed: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:model-value', 'update:selectedAgent', 'transfer-complete'],

  data() {
    return {
      isMobile: isMobile(),

      queues: [],
      agents: [],
      selectedAgent: null,

      searchQueue: '',
      searchAgent: '',

      showTransferDisclaimer: false,
    };
  },

  computed: {
    ...mapState(useRooms, [
      'contactToTransfer',
      'rooms',
      'activeRoom',
      'activeTab',
      'selectedOngoingRooms',
      'selectedWaitingRooms',
    ]),
    ...mapWritableState(useRooms, ['activeRoomTags']),
    ...mapState(useProfile, ['me']),

    currentSelectedRooms() {
      return this.activeTab === 'ongoing'
        ? this.selectedOngoingRooms
        : this.selectedWaitingRooms;
    },

    roomsToTransfer() {
      if (this.bulkTransfer) {
        return this.rooms.filter((room) =>
          this.currentSelectedRooms.includes(room.uuid),
        );
      }

      return this.rooms.filter((room) => room.uuid === this.contactToTransfer);
    },

    showTransferToOtherSectorDisclaimer() {
      const queueOption = this.modelValue?.[0];
      if (!queueOption?.value) return false;

      return this.roomsToTransfer.some(
        (room) => room.queue?.sector !== queueOption?.sector_uuid,
      );
    },

    dropdownFixed() {
      return this.fixed ? 'fixed' : 'relative';
    },

    selectedQueueOption: {
      get() {
        return this.modelValue?.[0] || null;
      },
      set(option) {
        this.$emit('update:model-value', option ? [option] : []);

        if (option?.value) {
          this.getAgents(option.value);
        }
      },
    },

    isAgentsFieldDisabled() {
      const queueValue = this.modelValue?.[0]?.value;
      return !queueValue || this.agents?.length < 2;
    },

    isSelectedAgentOffline() {
      return (
        this.selectedAgent?.value && this.selectedAgent?.status === 'offline'
      );
    },
    haveSelectedQueue() {
      return !!this.modelValue?.[0]?.value;
    },
    isAgentsListEmpty() {
      return this.haveSelectedQueue && this.agents?.length < 2;
    },

    transferDisclaimerText() {
      if (this.isSelectedAgentOffline) {
        return this.$t('bulk_transfer.disclaimer.selected_agent_offline');
      }

      if (this.isAgentsListEmpty) {
        return this.$t('bulk_transfer.disclaimer.without_online_agents');
      }
      return '';
    },
  },

  watch: {
    selectedAgent(newSelectedAgent) {
      this.$emit(
        'update:selectedAgent',
        newSelectedAgent ? [newSelectedAgent] : [],
      );

      this.showTransferDisclaimer = newSelectedAgent?.status === 'offline';
    },
    modelValue: {
      handler(newValue) {
        const queueUuid = newValue?.[0]?.value;
        if (queueUuid) {
          this.getAgents(queueUuid);
        }
      },
      immediate: false,
    },
  },

  mounted() {
    this.queues = [];
    this.agents = [];
    this.getQueues();
  },

  methods: {
    ...mapActions(useRooms, [
      'setSelectedOngoingRooms',
      'setSelectedWaitingRooms',
      'setContactToTransfer',
      'removeRoom',
    ]),

    async getQueues() {
      const newQueues = await Queue.listByProject();

      const treatedQueues = newQueues.results.map(
        ({ name, sector_name, uuid, sector_uuid }) => ({
          sector_uuid,
          queue_name: name,
          label: `${name} | ${i18n.global.t('sector.title')} ${sector_name}`,
          value: uuid,
        }),
      );

      this.queues = treatedQueues;
    },

    async getAgents(queueUuid) {
      this.showTransferDisclaimer = false;

      const newAgents = await Queue.agentsToTransfer(queueUuid);

      const treatedAgents = newAgents
        .filter((agent) => agent.email !== this.me.email)
        .map(({ first_name, last_name, email, status }) => ({
          label: [first_name, last_name].join(' ').trim() || email,
          value: email,
          status,
        }));

      if (treatedAgents.length === 0) {
        this.showTransferDisclaimer = true;
      }

      this.agents = treatedAgents;
    },

    /**
     * Performs a bulk transfer of selected rooms to a specific queue or agent.
     * This function must be associated with an appropriate event.
     *
     * @returns {Promise<void>} A promise that resolves when the bulk transfer is complete.
     */
    async transfer() {
      const { roomsToTransfer } = this;

      const selectedQueue = this.modelValue?.[0]?.value;
      const selectedAgent = this.selectedAgent?.value;

      try {
        const response = await Room.bulkTranfer({
          rooms: roomsToTransfer.map((room) => room.uuid),
          intended_queue: selectedQueue,
          intended_agent: selectedAgent,
        });

        if (response.status === 200) {
          this.transferSuccess();
          this.resetRoomsToTransfer();
          if (this.activeRoom) {
            const { results } = await Room.getRoomTags(this.activeRoom.uuid, {
              next: this.tagsNext,
              limit: 20,
            });
            this.activeRoomTags = results;
          }
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
      this.setSelectedOngoingRooms([]);
      this.setSelectedWaitingRooms([]);
      this.setContactToTransfer('');
    },

    transferSuccess() {
      this.callSuccessAlert();
      this.$emit('transfer-complete', 'success');
    },
    transferError() {
      this.callErrorAlert();
      this.$emit('transfer-complete', 'error');
    },

    callSuccessAlert() {
      const selectedAgentLabel = this.selectedAgent?.label;
      const selectedQueueUuid = this.modelValue?.[0]?.value;
      const selectedQueueName = this.queues.find(
        (queue) => queue.value === selectedQueueUuid,
      )?.queue_name;

      const destination = selectedAgentLabel || selectedQueueName;

      const toDestination = this.selectedAgent ? 'agent' : 'queue';

      this.getAlert({
        text: i18n.global.t(`contact_transferred_to_${toDestination}`, {
          [toDestination]: destination,
        }),
        type: 'success',
      });
    },

    callErrorAlert() {
      this.getAlert({
        text: i18n.global.t('contact_transferred_error'),
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
};
</script>

<style lang="scss" scoped>
:deep(.unnnic-select__options),
:deep(.unnnic-select .dropdown) {
  position: v-bind(dropdownFixed);
  left: auto;
  right: auto;
}
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

        .field__label {
          margin: 0 0 $unnnic-spacing-xs;
        }
      }

      &__disclaimer {
        margin-top: -$unnnic-spacing-nano;

        &--small {
          margin-top: $unnnic-spacing-xs;
        }
      }
    }
  }
}
</style>
