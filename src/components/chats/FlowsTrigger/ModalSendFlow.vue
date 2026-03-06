<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-send-flow"
    data-testid="modal-send-flow"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('flows_trigger.send') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-send-flow__content">
        <SelectFlow
          v-model="selectedFlow"
          data-testid="select-flow"
        />
      </section>
      <UnnnicDialogFooter>
        <SendFlowButton
          class="modal-send-flow__handler"
          :contacts="contacts"
          :selectedFlow="selectedFlow"
          data-testid="send-flow-button"
          @send-flow-finished="finishSendFlow"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import callUnnnicAlert from '@/utils/callUnnnicAlert';

import SelectFlow from './SelectFlow.vue';
import SendFlowButton from './SendFlowButton.vue';

export default {
  name: 'ModalSendFlow',

  components: {
    SelectFlow,
    SendFlowButton,
  },

  props: {
    contacts: {
      type: Array,
      required: true,
    },
  },
  emits: ['close', 'send-flow-finished'],

  data() {
    return {
      isOpen: true,
      selectedFlow: '',
    };
  },

  watch: {
    isOpen(value) {
      if (!value) this.$emit('close');
    },
  },

  methods: {
    finishSendFlow({ hasError }) {
      callUnnnicAlert({
        props: {
          text: hasError
            ? this.$t('flows_trigger.error_triggering')
            : this.$t('flows_trigger.successfully_triggered'),
          type: hasError ? 'error' : 'success',
        },
        seconds: 5,
      });

      this.$emit('send-flow-finished');
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-send-flow {
  &__content {
    padding: $unnnic-space-6;
  }

  :deep(.unnnic-select-smart) .dropdown-data {
    // !important at position is needed here because the
    // unnnicSelectSmart base already uses !important
    position: initial !important;
  }
}
</style>
