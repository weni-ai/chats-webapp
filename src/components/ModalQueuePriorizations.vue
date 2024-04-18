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
            v-model="permissionQueues"
            multiple
            :options="permissionQueuesOptions"
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
  props: {
    viewedAgent: {
      type: String,
    },
  },
  data() {
    return {
      permissionQueues: [],
      permissionQueuesOptions: [],
      roleIdSelected: 1,
      roleIdUnSelected: 2,
      showModalQueue: false,
      noQueueSelected: false,
    };
  },

  watch: {
    permissionQueues: {
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
      rooms: (state) => state.chats.rooms,
    }),

    verifySelectedLength() {
      return this.permissionQueues.length > 0;
    },
  },
  methods: {
    async getListQueues() {
      try {
        let me = this.me.email;
        const response = await Queues.getListQueues(me);
        response.user_permissions.forEach((permission) => {
          if (permission.role === 1) {
            this.permissionQueues.push({
              value: permission.uuid,
              label: permission.queue_name,
              role: permission.role,
              queue: permission.queue,
            });
          }

          this.permissionQueuesOptions.push({
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
      const { rooms } = this.rooms;

      try {
        const queuesOptions = this.permissionQueuesOptions.map(
          (queue) => queue.value,
        );
        const queuesOptionsUnselected = this.permissionQueuesOptions.map(
          (queue) => queue.queue,
        );
        const queuesValue = this.permissionQueues.map((queue) => queue.value);
        const queueUuid = this.permissionQueues.map((queue) => queue.queue);

        const filteringQueues = queuesOptions.filter(
          (queue) => !queuesValue.includes(queue),
        );

        const filteringUnselectedQueues = queuesOptionsUnselected.filter(
          (queue) => !queueUuid.includes(queue),
        );

        const selectedQueues = queuesValue.map((queueUuid) => ({
          uuid: queueUuid,
          role: this.roleIdSelected,
        }));

        const unselectedQueues = filteringQueues.map((queueUuid) => ({
          uuid: queueUuid,
          role: this.roleIdUnSelected,
        }));

        const unselectedQueuesOptions = filteringUnselectedQueues.map(
          (queueUuid) => ({
            queue: queueUuid,
            role: this.roleIdUnSelected,
          }),
        );

        const response = await Queues.editListQueues(
          selectedQueues.concat(unselectedQueues),
        );

        callUnnnicAlert({
          props: {
            text: this.$t('chats.success_update_queues'),
            type: 'success',
          },
          seconds: 5,
        });

        console.log(unselectedQueuesOptions, 'opçoes nao selecionadas');
        console.log(rooms, 'salas');

        // const unselectedQueueUuids = new Set(
        //   unselectedQueuesOptions.map(
        //     (unselectedQueue) => unselectedQueue.queue,
        //   ),
        // );

        // rooms.forEach((room) => {
        //   const roomQueueUuid = room.queue.uuid;
        //   console.log(roomQueueUuid, 'id da sala!');

        //   if (unselectedQueueUuids.has(roomQueueUuid)) {
        //     console.log(unselectedQueueUuids, 'salas');
        //     this.$store.dispatch('chats/rooms/removeRoom', roomQueueUuid);
        //   } else {
        //     console.log('nao é igual');
        //   }
        // });

        this.$emit('close');
        this.$root.$children[0].ws.reconnect();
        return response;
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
      const queuesValue = this.permissionQueues.map((queue) => queue.value);
      const selectedQueues = queuesValue.map((queueUuid) => ({
        uuid: queueUuid,
        role: this.roleIdSelected,
      }));

      if (selectedQueues.length < 1) {
        this.permissionQueuesOptions.push({
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
