<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="select-flow"
    data-testid="select-flow-container"
  >
    <UnnnicLabel
      :label="$t('flows_trigger.select')"
      data-testid="select-flow-label"
    />
    <UnnnicSelectSmart
      v-model="flowUuid"
      :options="templates"
      :disabled="isDisabled"
      :loading="loadingFlows"
      autocomplete
      autocompleteIconLeft
      autocompleteClearOnFocus
      data-testid="select-flow-input"
      @update:model-value="getFlowTrigger(flowUuid?.[0]?.value)"
    />
  </div>
</template>

<script>
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

export default {
  name: 'SelectFlow',

  props: {
    modelValue: {
      type: String,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    projectUuidFlow: {
      type: String,
      required: false,
      default: '',
    },
  },
  emits: ['update:modelValue'],

  data() {
    return {
      flowUuid: [],
      templates: [{ value: '', label: this.$t('search_or_select') }],
      selectedFlow: '',
      loadingFlows: false,
    };
  },

  watch: {
    projectUuidFlow(newProjectUuidFlow) {
      this.flowUuid = [{ value: '', label: this.$t('search_or_select') }];
      this.$emit('update:modelValue', '');
      this.getFlows(newProjectUuidFlow);
    },
  },

  mounted() {
    if (!this.isDisabled) {
      this.getFlows();
    }
  },

  methods: {
    async getFlows(projectUuidFlow) {
      this.loadingFlows = true;

      const defaultOption = { value: '', label: this.$t('search_or_select') };
      this.flowUuid = [defaultOption];
      this.$emit('update:modelValue', '');

      try {
        const response = await FlowsTrigger.getFlows(projectUuidFlow);

        const treatedTemplates = [defaultOption];

        response.forEach((flow) => {
          const { name, uuid } = flow;

          treatedTemplates.push({
            value: uuid,
            label: name,
          });
        });

        this.templates = treatedTemplates;
      } catch (error) {
        this.templates = [defaultOption];
        console.error('Error getting flows', error);
      } finally {
        this.loadingFlows = false;
      }
    },

    getFlowTrigger(uuid) {
      this.$emit('update:modelValue', uuid);
    },
  },
};
</script>
