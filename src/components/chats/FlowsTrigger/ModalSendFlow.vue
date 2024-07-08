<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicModal
    :text="$t('flows_trigger.send')"
    class="modal-send-flow"
    @close="$emit('close')"
  >
    <SelectFlow v-model="selectedFlow" />

    <template #options>
      <SendFlowButton
        class="modal-send-flow__handler"
        :contacts="contacts"
        :selectedFlow="selectedFlow"
        @send-flow-finished="finishSendFlow"
      />
    </template>
  </UnnnicModal>
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

  data() {
    return {
      selectedFlow: '',
    };
  },

  methods: {
    finishSendFlow() {
      callUnnnicAlert({
        props: {
          text: this.$t('flows_trigger.successfully_triggered'),
          type: 'success',
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
  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background-body {
      &-description {
        padding: 0;

        &-container {
          padding-bottom: 0;
        }
      }
    }
  }
  :deep(.unnnic-select-smart) .dropdown-data {
    // !important at position is needed here because the
    // unnnicSelectSmart base already uses !important
    position: initial !important;
  }
}
</style>
