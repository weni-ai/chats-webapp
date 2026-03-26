<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="select-flow"
    data-testid="select-flow-container"
  >
    <UnnnicSelect
      v-model="flowSelection"
      data-testid="select-flow-input"
      :options="templates"
      :disabled="isDisabled || loadingFlows"
      :label="$t('flows_trigger.select')"
      :placeholder="$t('search_or_select')"
      returnObject
      clearable
      enableSearch
      :search="searchFlow"
      @update:search="searchFlow = $event"
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
      flowSelection: null,
      templates: [],
      searchFlow: '',
      loadingFlows: false,
    };
  },

  watch: {
    projectUuidFlow(newProjectUuidFlow) {
      this.flowSelection = null;
      this.$emit('update:modelValue', '');
      this.getFlows(newProjectUuidFlow);
    },

    flowSelection(newVal) {
      const uuid = newVal?.value || '';
      if (uuid !== this.modelValue) {
        this.$emit('update:modelValue', uuid);
      }
    },

    modelValue: {
      immediate: true,
      handler(uuid) {
        this.syncSelectionFromModelValue(uuid);
      },
    },

    templates: {
      deep: true,
      handler() {
        this.syncSelectionFromModelValue(this.modelValue);
      },
    },
  },

  mounted() {
    if (!this.isDisabled) {
      this.getFlows();
    }
  },

  methods: {
    syncSelectionFromModelValue(uuid) {
      if (!uuid) {
        this.flowSelection = null;
        return;
      }
      const opt = this.templates.find((t) => t.value === uuid);
      if (opt) {
        if (this.flowSelection?.value !== opt.value) {
          this.flowSelection = opt;
        }
      } else {
        this.flowSelection = null;
      }
    },

    async getFlows(projectUuidFlow) {
      this.loadingFlows = true;
      this.templates = [];
      this.flowSelection = null;

      try {
        const response = await FlowsTrigger.getFlows(projectUuidFlow);

        this.templates = response.map(({ name, uuid }) => ({
          value: uuid,
          label: name,
        }));
      } catch (error) {
        this.templates = [];
        console.error('Error getting flows', error);
      } finally {
        this.loadingFlows = false;
        this.syncSelectionFromModelValue(this.modelValue);
      }
    },
  },
};
</script>
