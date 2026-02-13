<template>
  <UnnnicDialog
    v-model:open="open"
    data-testid="modal-delete-group"
    class="delete-notice"
  >
    <UnnnicDialogContent size="small">
      <UnnnicDialogHeader type="warning">
        <UnnnicDialogTitle>
          {{
            $t('config_chats.groups.delete.title', { groupName: group.name })
          }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="delete-notice__content">
        <p
          class="delete-notice__notice"
          data-testid="delete-notice"
        >
          {{ $t('config_chats.groups.delete.notice') }}
        </p>
        <UnnnicLabel :label="$t('confirmation')" />
        <UnnnicInput
          v-model="groupName"
          :placeholder="group.name"
          data-testid="input-dashboard-name"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isLoadingRequest"
          @click="open = false"
        />
        <UnnnicButton
          :text="$t('delete')"
          type="warning"
          :disabled="!validGroupName"
          :loading="isLoadingRequest"
          @click="deleteGroup"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import Group from '@/services/api/resources/settings/group';
import { useSettings } from '@/store/modules/settings';
import Unnnic from '@weni/unnnic-system';
import { mapWritableState } from 'pinia';

export default {
  name: 'DeleteGroupModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    group: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'update:modelValue'],
  data() {
    return {
      groupName: '',
      isLoadingRequest: false,
    };
  },
  computed: {
    ...mapWritableState(useSettings, ['groups']),
    validGroupName() {
      return this.groupName === this.group.name;
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
  methods: {
    async deleteGroup() {
      try {
        this.isLoadingRequest = true;
        await Group.delete(this.group.uuid);
        this.groups = this.groups.filter(
          ({ uuid }) => uuid !== this.group.uuid,
        );
        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.groups.delete.success'),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.groups.delete.error'),
            type: 'error',
          },
          seconds: 5,
        });
        console.log(error);
      } finally {
        this.isLoadingRequest = false;
        this.$emit('close');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.delete-notice {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-6;
    color: $unnnic-color-fg-base;
  }
}
</style>
