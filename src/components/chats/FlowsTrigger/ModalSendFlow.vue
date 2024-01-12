<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <unnnic-modal @close="$emit('close')" :text="$t('flows_trigger.send')" class="modal-send-flow">
    <select-flow v-model="selectedFlow" />

    <template #options>
      <send-flow-button
        class="modal-send-flow__handler"
        :contacts="contacts"
        :selectedFlow="selectedFlow"
        @send-flow-finished="finishSendFlow"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import { unnnicCallAlert } from '@weni/unnnic-system';

import SelectFlow from './SelectFlow';
import SendFlowButton from './SendFlowButton';

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
      unnnicCallAlert({
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
}
</style>
