<template>
  <UnnnicModal
    class="queue-modal"
    :text="$t('chats.select_services_queues')"
    @close="$emit('close')"
  >
    <section class="queue-modal-form">
      <section
        v-if="!verifySelectedLength"
        class="queue-modal-disclaimer"
      >
        <UnnnicIconSvg
          filled
          icon="alert-circle-1"
          size="md"
          scheme="feedback-yellow"
        />
        <p>{{ $t('chats.select_at_least') }}</p>
      </section>
      <section class="queue-modal-select">
        <section class="queue-modal-input">
          <UnnnicLabel :label="$t('chats.select_the_queues')" />
          <UnnnicSelectSmart
            v-model="selectedQueues"
            multiple
            :options="queues"
            :multipleWithoutSelectsMessage="$t('chats.no_queue_selected')"
          />
        </section>
      </section>
    </section>
    <template #options>
      <UnnnicButton
        :text="$t('cancel')"
        type="tertiary"
        size="large"
        @click="$emit('close')"
      />
      <UnnnicButton
        :text="$t('save')"
        type="primary"
        size="large"
        :disabled="!verifySelectedLength"
        @click="saveListQueues"
      />
    </template>
  </UnnnicModal>
</template>
<script>
import { mapState } from 'vuex';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import Queues from '@/services/api/resources/chats/queues';

export default {
  name: 'ModalQueuePriorizations',

  data() {
    return {
      selectedQueues: [],
      queues: [
        {
          value: '',
          label: this.$t('chats.select_your_queues'),
        },
      ],
      roleIdSelected: 1,
      roleIdUnselected: 2,
      showModalQueue: false,
      noQueueSelected: false,
    };
  },

  watch: {
    selectedQueues: {
      handler: 'updateQueuesPlaceholder',
      deep: true,
    },
  },

  created() {
    this.getListQueues();
  },

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      rooms: (state) => state.chats.rooms.rooms,
    }),

    verifySelectedLength() {
      return this.selectedQueues.length > 0;
    },
  },
  methods: {
    async getListQueues() {
      try {
        let me = this.me.email;
        const response = await Queues.getListQueues(me);
        response.user_permissions.forEach((permission) => {
          if (permission.role === this.roleIdSelected) {
            this.selectedQueues.push({
              value: permission.uuid,
              label: permission.queue_name,
              role: permission.role,
              queue: permission.queue,
            });
          }

          this.queues.push({
            value: permission.uuid,
            label: permission.queue_name,
            role: permission.role,
            queue: permission.queue,
          });
        });
      } catch (error) {
        console.error(error);
      }
    },

    async saveListQueues() {
      const { rooms } = this;

      try {
        const queuesValues = this.queues.map((queue) => queue.value);
        const queuesUuids = this.queues.map((queue) => queue.queue);

        const selectedQueuesValues = this.selectedQueues.map(
          (queue) => queue.value,
        );
        const selectedQueuesUuids = this.selectedQueues.map(
          (queue) => queue.queue,
        );

        const filteringQueues = queuesValues.filter(
          (queue) => !selectedQueuesValues.includes(queue),
        );
        const filteringUnselectedQueues = queuesUuids.filter(
          (queue) => !selectedQueuesUuids.includes(queue),
        );

        const selectedQueues = selectedQueuesValues.map((queueUuid) => ({
          uuid: queueUuid,
          role: this.roleIdSelected,
        }));
        const unselectedQueues = filteringQueues.map((queueUuid) => ({
          uuid: queueUuid,
          role: this.roleIdUnselected,
        }));

        await Queues.editListQueues(selectedQueues.concat(unselectedQueues));

        const roomsWithQueuesToRemove = rooms.filter((room) =>
          filteringUnselectedQueues.includes(room.queue?.uuid),
        );
        roomsWithQueuesToRemove.forEach((room) => {
          if (room.uuid) {
            this.$store.dispatch('chats/rooms/removeRoom', room.uuid);
          }
        });
        await this.$store.dispatch('chats/rooms/getAll', {
          limit: 100,
        });

        callUnnnicAlert({
          props: {
            text: this.$t('chats.success_update_queues'),
            type: 'success',
          },
          seconds: 5,
        });

        this.$emit('close');
        this.$root.$children[0].wsReconnect();
      } catch (error) {
        console.error(error);
        callUnnnicAlert({
          props: {
            text: this.$t('chats.error_update_queues'),
            type: 'error',
          },
          seconds: 5,
        });

        this.$emit('close');
      }
    },

    updateQueuesPlaceholder() {
      const queuesValue = this.selectedQueues.map((queue) => queue.value);
      const selectedQueues = queuesValue.map((queueUuid) => ({
        uuid: queueUuid,
        role: this.roleIdSelected,
      }));

      if (selectedQueues.length < 1) {
        this.queues.push({
          value: '',
          label: this.$t('chats.select_your_queues'),
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.queue-modal {
  .queue-modal-form {
    display: grid;
    gap: $unnnic-spacing-sm;
    text-align: start;
    .queue-modal-disclaimer {
      display: flex;
      flex-direction: row;
      gap: $unnnic-spacing-xs;
      justify-content: center;

      padding: $unnnic-spacing-sm;

      font-size: $unnnic-font-size-body-gt;
      color: $unnnic-color-neutral-dark;

      border-radius: $unnnic-border-radius-sm;
      border: $unnnic-border-width-thin solid $unnnic-color-neutral-soft;
    }
    .queue-modal-select {
      display: flex;
      gap: $unnnic-spacing-xs;
      .queue-modal-input {
        flex: 1;
      }
    }
  }
  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background {
      width: 50%;
      overflow: visible;
      &-body-description-container {
        padding-bottom: 0;
      }
      .unnnic-modal-container-background-body {
        &-description,
        &-description-container {
          overflow: visible;
        }
      }
    }
  }
}
</style>