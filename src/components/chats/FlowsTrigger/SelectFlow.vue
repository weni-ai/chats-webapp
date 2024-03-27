<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="select-flow">
    <UnnnicLabel :label="$t('flows_trigger.select')" />
    <UnnnicSelectSmart
      v-model="flowUuid"
      :options="templates"
      autocomplete
      autocompleteIconLeft
      autocompleteClearOnFocus
      @input="getFlowTrigger(flowUuid?.[0].value)"
    />
  </div>
</template>

<script>
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

export default {
  name: 'SelectFlow',

  data() {
    return {
      flowUuid: [],
      templates: [{ value: '', label: this.$t('search_or_select') }],
      selectedFlow: '',
      loadingFlows: false,
    };
  },

  mounted() {
    this.getFlows();
  },

  props: {
    value: {
      type: String,
    },
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
        response.forEach((flow) => {
          const { name, uuid } = flow;

          treatedTemplates.push({
            value: uuid,
            label: name,
          });
        });
        this.templates = treatedTemplates;

        this.loadingFlows = false;
      } catch (error) {
        this.loadingFlows = false;
        console.log(error);
      }
    },

    async getFlowTrigger(uuid) {
      this.$emit('input', uuid);
    },
  },
};
</script>
