<template>
  <section
    class="select-queue-flows"
    data-testid="select-queue-flows"
  >
    <section
      class="select-queue-flows__label"
      data-testid="select-queue-flows-label"
    >
      {{ $t('config_chats.queues.bond_flows_queue.select.label') }}
      <UnnnicToolTip
        enabled
        side="right"
        maxWidth="23rem"
        :text="$t('config_chats.queues.bond_flows_queue.select.tooltip')"
      >
        <UnnnicIcon
          icon="ri:question-line"
          scheme="fg-base"
          size="sm"
        />
      </UnnnicToolTip>
    </section>
    <UnnnicSelect
      v-model="flowSelection"
      data-testid="select-queue-flows-input"
      :options="availableFlowOptions"
      :disabled="loadingFlows"
      :placeholder="
        $t('config_chats.queues.bond_flows_queue.select.placeholder')
      "
      clearable
      enableSearch
      :search="searchFlow"
      @update:search="searchFlow = $event"
    />
    <section
      v-if="selectedFlows.length > 0"
      class="select-queue-flows__chips"
      data-testid="select-queue-flows-chips"
    >
      <TagGroup
        :tags="selectedFlowTags"
        disabledTag
        hasCloseIcon
        @close="(flow) => removeFlow(flow.uuid)"
      />
    </section>
  </section>
</template>

<script>
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'SelectQueueFlows',

  components: {
    TagGroup,
  },

  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      flowSelection: '',
      flows: [],
      searchFlow: '',
      loadingFlows: false,
    };
  },

  computed: {
    selectedFlows: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },

    availableFlowOptions() {
      const selectedUuids = new Set(this.selectedFlows);

      return this.flows
        .filter((flow) => !selectedUuids.has(flow.uuid))
        .map(({ uuid, name }) => ({
          value: uuid,
          label: name,
        }));
    },

    selectedFlowTags() {
      const flowsByUuid = new Map(
        this.flows.map((flow) => [flow.uuid, flow.name]),
      );

      return this.selectedFlows.map((uuid) => ({
        uuid,
        name: flowsByUuid.get(uuid) || uuid,
      }));
    },
  },

  watch: {
    flowSelection(uuid) {
      if (!uuid) {
        return;
      }

      const alreadySelected = this.selectedFlows.includes(uuid);
      const flowExists = this.flows.some((item) => item.uuid === uuid);

      if (!alreadySelected && flowExists) {
        this.selectedFlows = [...this.selectedFlows, uuid];
      }

      this.$nextTick(() => {
        this.flowSelection = '';
        this.searchFlow = '';
      });
    },
  },

  mounted() {
    this.getFlows();
  },

  methods: {
    removeFlow(flowUuid) {
      this.selectedFlows = this.selectedFlows.filter(
        (uuid) => uuid !== flowUuid,
      );
    },

    async getFlows() {
      this.loadingFlows = true;

      try {
        const response = await FlowsTrigger.getFlows(undefined, {
          verify_chats_tag: true,
        });

        this.flows = response.map(({ uuid, name }) => ({ uuid, name }));
      } catch (error) {
        this.flows = [];
        console.error('Error getting flows', error);
      } finally {
        this.loadingFlows = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.select-queue-flows {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__label {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    margin-bottom: $unnnic-space-1;

    color: $unnnic-color-fg-base;
    font: $unnnic-font-body;

    :deep(.unnnic-tooltip) {
      display: flex;
    }
  }

  &__chips {
    width: 100%;
  }
}
</style>
