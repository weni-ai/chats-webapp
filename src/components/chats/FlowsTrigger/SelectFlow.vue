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
      autocomplete
      autocompleteIconLeft
      autocompleteClearOnFocus
      data-testid="select-flow-input"
      @update:model-value="getFlowTrigger(flowUuid?.[0].value)"
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
  },
  emits: ['update:modelValue', 'update:projectUuidFlow'],

  data() {
    return {
      flowUuid: [],
      templates: [{ value: '', label: this.$t('search_or_select') }],
      selectedFlow: '',
      projectUuidFlows: [],
      loadingFlows: false,
    };
  },

  mounted() {
    this.getFlows();
  },

  methods: {
    async getFlows() {
      this.loadingFlows = true;
      try {
        const response = await FlowsTrigger.getFlows();

        const treatedTemplates = [
          {
            value: '',
            label: this.$t('search_or_select'),
          },
        ];
        const projectUuidFlows = [];
        response.forEach((flow) => {
          const { name, uuid, results } = flow;

          treatedTemplates.push({
            value: uuid,
            label: name,
          });

          if (results?.length > 0) {
            projectUuidFlows.push({
              flowUuid: uuid,
              projectUuidFlow: results[0].node_uuids[0],
            });
          }
        });
        this.templates = treatedTemplates;
        this.projectUuidFlows = projectUuidFlows;
        this.loadingFlows = false;
      } catch (error) {
        this.loadingFlows = false;
        console.log(error);
      }
    },

    getFlowTrigger(uuid) {
      this.$emit('update:modelValue', uuid);
      if (this.projectUuidFlows.length > 0) {
        const projectUuidFlow = this.projectUuidFlows.find(
          (projectUuidFlow) => projectUuidFlow.flowUuid === uuid,
        );
        if (projectUuidFlow) {
          this.$emit('update:projectUuidFlow', projectUuidFlow.projectUuidFlow);
        }
      }
    },
  },
};
</script>
