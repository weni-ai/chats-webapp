<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('config_chats.groups.delete.title', { groupName: group.name })"
    :primaryButtonProps="{
      text: $t('delete'),
      disabled: !validGroupName,
      loading: isLoadingRequest,
    }"
    :secondaryButtonProps="{ disabled: isLoadingRequest }"
    showActionsDivider
    showCloseIcon
    size="sm"
    data-testid="modal-delete-group"
    @update:model-value="$emit('close')"
    @primary-button-click="deleteGroup"
  >
    <p
      class="delete-notice"
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
  </UnnnicModalDialog>
</template>

<script>
import Group from '@/services/api/resources/settings/group';
import { useSettings } from '@/store/modules/settings';
import Unnnic from '@weni/unnnic-system';
import { mapWritableState } from 'pinia';

export default {
  name: 'DeleteGroupModal',
  props: {
    group: {
      type: String,
      required: true,
    },
  },
  emits: ['close'],
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
            type: 'success',
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
