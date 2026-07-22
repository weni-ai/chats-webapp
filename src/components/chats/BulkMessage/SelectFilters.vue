<template>
  <section class="bulk-message-form__select-filters">
    <UnnnicMultiSelect
      class="bulk-message-form__select-filter"
      :options="queuesOptions"
      :modelValue="props.queues"
      :label="$t('mass_message.form.recipients.filters.queues.label')"
      size="sm"
      clearable
      @update:model-value="updateSelectedQueues"
    />
    <UnnnicMultiSelect
      class="bulk-message-form__select-filter"
      :options="representativesOptions"
      :modelValue="props.representatives"
      :label="$t('mass_message.form.recipients.filters.representatives.label')"
      size="sm"
      clearable
      @update:model-value="updateSelectedRepresentatives"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import QueueService from '@/services/api/resources/settings/queue';
import ProjectService from '@/services/api/resources/settings/project';

import i18n from '@/plugins/i18n';

const props = defineProps<{
  queues: string[];
  representatives: string[];
}>();

const emit = defineEmits<{
  'update:queues': [queues: string[]];
  'update:representatives': [representatives: string[]];
}>();

const { t } = i18n.global;

const representativesList = ref([]);
const queuesList = ref([]);

const queuesOptions = computed(() => {
  const allOption = {
    label: t('mass_message.form.recipients.filters.queues.all'),
    value: 'all',
  };
  const parsedQueues = queuesList.value.map((queue) => ({
    label: `${queue.name} | ${t('sector.title')} ${queue.sector_name}`,
    value: queue.uuid,
    disabled: props.queues.includes('all'),
  }));
  return [allOption, ...parsedQueues];
});
const representativesOptions = computed(() => {
  const allOption = {
    label: t('mass_message.form.recipients.filters.representatives.all'),
    value: 'all',
  };
  const parsedRepresentatives = representativesList.value.map(
    (representative) => {
      const { user } = representative;
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      return {
        label: fullName || user.email,
        value: user.email,
        disabled: props.representatives.includes('all'),
      };
    },
  );
  return [allOption, ...parsedRepresentatives];
});

const queuePage = ref(1);
const QUEUE_LIMIT_PER_PAGE = 100;

const fetchQueues = async () => {
  const { results, next } = await QueueService.listByProject({
    limit: QUEUE_LIMIT_PER_PAGE,
    offset: (queuePage.value - 1) * QUEUE_LIMIT_PER_PAGE,
  });

  queuesList.value = queuesList.value.concat(results);

  if (next) {
    queuePage.value += 1;
    await fetchQueues();
  }
};

const representativePage = ref(1);
const REPRESENTATIVE_LIMIT_PER_PAGE = 100;
const fetchRepresentatives = async () => {
  const offset = (representativePage.value - 1) * REPRESENTATIVE_LIMIT_PER_PAGE;
  const { results, next } = await ProjectService.agents(
    offset,
    REPRESENTATIVE_LIMIT_PER_PAGE,
  );
  representativesList.value = representativesList.value.concat(results);

  if (next) {
    representativePage.value += 1;
    await fetchRepresentatives();
  }
};

const updateSelectedQueues = (queues: string[]) => {
  if (queues.includes('all')) {
    queues = ['all'];
  }
  emit('update:queues', queues);
};
const updateSelectedRepresentatives = (representatives: string[]) => {
  if (representatives.includes('all')) {
    representatives = ['all'];
  }
  emit('update:representatives', representatives);
};

onMounted(() => {
  fetchQueues();
  fetchRepresentatives();
});
</script>

<style scoped lang="scss">
.bulk-message-form {
  &__select-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $unnnic-space-6;
  }

  &__select-filter {
    flex: 1;
  }
}
</style>
