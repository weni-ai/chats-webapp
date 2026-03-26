<template>
  <UnnnicDialog
    v-model:open="open"
    class="queue-modal"
  >
    <UnnnicDialogContent>
      <section class="queue-modal__form">
        <p class="queue-modal__form-title">
          {{ $t('chats.select_services_queues') }}
        </p>
        <UnnnicDisclaimer
          v-if="!verifySelectedLength"
          :description="$t('chats.select_at_least')"
          type="attention"
        />
        <section class="queue-modal-select">
          <section class="queue-modal-input">
            <UnnnicMultiSelect
              v-model="selectedQueues"
              data-testid="queue-priorizations-select"
              :options="queues"
              :label="$t('chats.select_the_queues')"
              :placeholder="$t('chats.select_your_queues')"
              returnObject
              clearable
              enableSearch
              :search="searchQueues"
              @update:search="searchQueues = $event"
            />
          </section>
        </section>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          size="large"
          @click="open = false"
        />
        <UnnnicButton
          :text="$t('save')"
          type="primary"
          size="large"
          :disabled="!verifySelectedLength"
          @click="saveListQueues"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>
<script>
import { mapActions, mapState, mapWritableState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';

import callUnnnicAlert from '@/utils/callUnnnicAlert';
import Queues from '@/services/api/resources/chats/queues';

export default {
  name: 'ModalQueuePriorizations',

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      selectedQueues: [],
      queues: [],
      searchQueues: '',
      roleIdSelected: 1,
      roleIdUnselected: 2,
    };
  },

  computed: {
    ...mapWritableState(useProfile, ['me']),
    ...mapState(useRooms, ['rooms']),

    verifySelectedLength() {
      return this.selectedQueues.length > 0;
    },
    open: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },

  watch: {
    'me.queues': {
      handler(_newQueues, oldQueues) {
        if (!oldQueues) this.handlerQueues();
      },
      immediate: true,
      deep: true,
    },
  },

  methods: {
    ...mapActions(useRooms, {
      removeRoom: 'removeRoom',
      getAllRooms: 'getAll',
    }),
    ...mapActions(useProfile, ['getMeQueues']),
    handlerQueues() {
      this.me.queues?.forEach((permission) => {
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

        const concatedQueuesRoles = selectedQueues.concat(unselectedQueues);

        await Queues.editListQueues(concatedQueuesRoles);

        concatedQueuesRoles.forEach((permission) => {
          if (!permission.uuid) return;
          const meQueuePermissionIndex = this.me.queues.findIndex(
            (mePermission) => mePermission.uuid === permission.uuid,
          );

          if (meQueuePermissionIndex > -1)
            this.me.queues[meQueuePermissionIndex].role = permission.role;
        });

        const roomsWithQueuesToRemove = rooms.filter((room) =>
          filteringUnselectedQueues.includes(room.queue?.uuid),
        );
        roomsWithQueuesToRemove.forEach((room) => {
          if (room.uuid) {
            this.removeRoom(room.uuid);
          }
        });
        await this.getAllRooms({ limit: 100 });

        callUnnnicAlert({
          props: {
            text: this.$t('chats.success_update_queues'),
            type: 'success',
          },
          seconds: 5,
        });
        this.$root.wsReconnect();
      } catch (error) {
        console.error(error);
        callUnnnicAlert({
          props: {
            text: this.$t('chats.error_update_queues'),
            type: 'error',
          },
          seconds: 5,
        });
      } finally {
        this.open = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.queue-modal {
  &__form {
    display: grid;
    gap: $unnnic-spacing-sm;
    text-align: start;
    padding: $unnnic-space-6;

    &-title {
      font: $unnnic-font-display-2;
      color: $unnnic-color-fg-emphasized;
    }

    .queue-modal-select {
      display: flex;
      gap: $unnnic-spacing-xs;
      .queue-modal-input {
        flex: 1;
      }
    }
  }
}
</style>
