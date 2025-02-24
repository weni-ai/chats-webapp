<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('config_chats.groups.delete.title', { groupName: group.name })"
    :primaryButtonProps="{
      text: $t('delete'),
      disabled: !validGroupName,
      loading: loadingRequest,
    }"
    :secondaryButtonProps="{ disabled: loadingRequest }"
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
      loadingRequest: false,
    };
  },
  computed: {
    validGroupName() {
      return this.groupName === this.group.name;
    },
  },
  methods: {
    deleteGroup() {
      // TODO
    },
  },
};
</script>
