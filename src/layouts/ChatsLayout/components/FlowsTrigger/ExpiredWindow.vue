<template>
  <section
    class="flows-trigger-expired-window"
    data-testid="flows-trigger-expired-window"
  >
    <header class="flows-trigger-expired-window__search">
      <UnnnicInput
        v-model="searchUrn"
        class="flows-trigger-expired-window__search-input"
        iconLeft="search-1"
        size="sm"
        :placeholder="$t('chats.search_contact')"
        data-testid="flows-trigger-expired-search"
      />
      <UnnnicPopover
        v-model:open="isFiltersOpen"
        @update:open="onFiltersOpen"
      >
        <UnnnicPopoverTrigger :asChild="true">
          <section>
            <UnnnicButton
              class="flows-trigger-expired-window__filters-button"
              type="secondary"
              size="small"
              :iconCenter="activeFiltersCount ? null : 'filter_list'"
              :iconLeft="activeFiltersCount ? 'filter_list' : null"
              :text="activeFiltersCount ? `(${activeFiltersCount})` : null"
              data-testid="flows-trigger-expired-filters"
            />
          </section>
        </UnnnicPopoverTrigger>
        <UnnnicPopoverContent
          align="end"
          data-testid="flows-trigger-expired-filters-popover"
          @interact-outside="preventNestedDismiss"
          @pointer-down-outside="preventNestedDismiss"
        >
          <section class="flows-trigger-expired-window__filters">
            <UnnnicMultiSelect
              ref="sectorsSelectRef"
              :modelValue="selectedSectors"
              data-testid="flows-trigger-expired-sectors"
              :options="sectorsOptions"
              :label="$t('config_chats.representatives.filter.sectors.label')"
              :placeholder="$t('select')"
              clearable
              enableSearch
              infiniteScroll
              :infiniteScrollCanLoadMore="canLoadMoreSectors"
              @update:model-value="onSelectSectors"
              @scroll-end="loadMoreSectors"
            />
            <UnnnicMultiSelect
              v-model="selectedQueues"
              data-testid="flows-trigger-expired-queues"
              :options="queuesOptions"
              :disabled="disableQueuesFilter"
              :label="$t('config_chats.representatives.filter.queues.label')"
              :placeholder="$t('select')"
              clearable
              enableSearch
            />
          </section>
          <UnnnicPopoverFooter>
            <section class="flows-trigger-expired-window__filters-actions">
              <UnnnicButton
                type="tertiary"
                :text="$t('clear')"
                :disabled="!canClearFilters"
                data-testid="flows-trigger-expired-filters-clear"
                @click="clearFilters"
              />
              <UnnnicButton
                type="primary"
                :text="$t('filter.label')"
                :disabled="!canApplyFilters"
                data-testid="flows-trigger-expired-filters-apply"
                @click="applyFilters"
              />
            </section>
          </UnnnicPopoverFooter>
        </UnnnicPopoverContent>
      </UnnnicPopover>
    </header>
    <UnnnicDisclaimer
      v-if="selectedCount > 0"
      class="flows-trigger-expired-window__disclaimer"
      type="informational"
      :description="
        $t('flows_trigger.expired_window_disclaimer', { count: selectedCount })
      "
      data-testid="flows-trigger-expired-disclaimer"
    />
    <section
      ref="contactsListRef"
      class="flows-trigger-expired-window__contacts"
      data-testid="flows-trigger-expired-contacts"
    >
      <FlowsContactsLoading v-if="isLoadingContacts && contacts.length === 0" />
      <p
        v-else-if="showNoResults"
        class="flows-trigger-expired-window__no-results"
        data-testid="flows-trigger-expired-empty"
      >
        {{ $t('without_results') }}
      </p>
      <FlowsContactCard
        v-for="contact in contacts"
        :key="contact.uuid"
        :name="contactCardName(contact)"
        :subtitle="getContactUrn(contact)"
        :selected="isContactSelected(contact)"
        :unnamed="!hasValidName(contact)"
        @toggle="toggleContact(contact)"
      />
    </section>
  </section>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useInfiniteScroll } from '@vueuse/core';

import FlowsContactCard from '@/components/chats/FlowsTrigger/FlowsContactCard.vue';
import FlowsContactsLoading from '@/views/loadings/FlowsTrigger/FlowsContactsLoading.vue';
import SectorService from '@/services/api/resources/settings/sector';
import QueueService from '@/services/api/resources/settings/queue';
import FlowsTriggerService from '@/services/api/resources/chats/flowsTrigger.js';
import { removeDuplicatedItems } from '@/utils/array';

defineOptions({
  name: 'FlowsTriggerExpiredWindow',
});

const emit = defineEmits(['update:selection']);

const { t } = useI18n();

const PAGE_SIZE = 20;

const searchUrn = ref('');
const searchContact = ref('');
let timerId = 0;

const isFiltersOpen = ref(false);
const sectorsSelectRef = useTemplateRef('sectorsSelectRef');

const appliedSectors = ref([]);
const appliedQueues = ref([]);

const selectedSectors = ref([]);
const sectorsOptions = ref([]);
const sectorsNext = ref(null);
const isLoadingSectors = ref(false);
const hasLoadedSectors = ref(false);

const selectedQueues = ref([]);
const queuesOptions = ref([]);
const queuesPage = ref(0);
const isLoadingQueues = ref(false);

const contactsListRef = useTemplateRef('contactsListRef');
const contacts = ref([]);
const contactsNext = ref(null);
const contactsCount = ref(0);
const isLoadingContacts = ref(true);
const ignoredContactUuids = ref([]);
let contactsRequestId = 0;

const disableQueuesFilter = computed(() => selectedSectors.value.length === 0);

const canClearFilters = computed(
  () =>
    selectedSectors.value.length > 0 ||
    selectedQueues.value.length > 0 ||
    appliedSectors.value.length > 0 ||
    appliedQueues.value.length > 0,
);

const canApplyFilters = computed(() => selectedSectors.value.length > 0);

const activeFiltersCount = computed(
  () =>
    Number(appliedSectors.value.length > 0) +
    Number(appliedQueues.value.length > 0),
);

const canLoadMoreSectors = () =>
  Boolean(sectorsNext.value) && !isLoadingSectors.value;

const hasSearch = computed(() => Boolean(searchContact.value));

const includedContactUuids = computed(() =>
  contacts.value
    .filter((contact) => !ignoredContactUuids.value.includes(contact.uuid))
    .map((contact) => contact.uuid),
);

const selectedCount = computed(() =>
  hasSearch.value
    ? includedContactUuids.value.length
    : Math.max(contactsCount.value - ignoredContactUuids.value.length, 0),
);

const showNoResults = computed(
  () => !isLoadingContacts.value && contacts.value.length === 0,
);

function preventNestedDismiss(event) {
  const target = event?.target;
  if (target?.closest?.('.unnnic-popover, .unnnic-multi-select')) {
    event.preventDefault();
  }
}

async function loadSectors({ reset = false } = {}) {
  if (isLoadingSectors.value) return;
  if (!reset && hasLoadedSectors.value && !sectorsNext.value) return;

  isLoadingSectors.value = true;
  try {
    const response = reset
      ? await SectorService.list({ limit: PAGE_SIZE, offset: 0 })
      : await SectorService.list({ nextReq: sectorsNext.value });

    const formatted = (response.results || []).map((sector) => ({
      value: sector.uuid,
      label: sector.name,
    }));

    sectorsOptions.value = removeDuplicatedItems(
      reset ? formatted : [...sectorsOptions.value, ...formatted],
      'value',
    );
    sectorsNext.value = response.next || null;
    hasLoadedSectors.value = true;
  } catch (error) {
    console.error('loadSectors', error);
  } finally {
    isLoadingSectors.value = false;
    sectorsSelectRef.value?.finishInfiniteScroll?.();
  }
}

function loadMoreSectors() {
  if (!canLoadMoreSectors()) {
    sectorsSelectRef.value?.finishInfiniteScroll?.();
    return;
  }
  loadSectors();
}

function syncDraftFromApplied() {
  selectedSectors.value = [...appliedSectors.value];
  selectedQueues.value = [...appliedQueues.value];
  queuesOptions.value = [];
  queuesPage.value = 0;

  if (selectedSectors.value.length) {
    getQueuesOptions();
  }
}

function onFiltersOpen(isOpen) {
  if (isOpen && !hasLoadedSectors.value) {
    loadSectors({ reset: true });
  }

  syncDraftFromApplied();
}

async function getQueuesOptions() {
  if (!selectedSectors.value.length || isLoadingQueues.value) return;

  isLoadingQueues.value = true;
  try {
    let hasNext = false;
    const { results, next } = await QueueService.listAllQueues({
      limit: PAGE_SIZE,
      offset: queuesPage.value * PAGE_SIZE,
      filters: {
        sectors: selectedSectors.value.filter((sector) => sector !== 'all'),
      },
    });
    const formattedResults = (results || []).flatMap((sector) =>
      (sector.queues || []).map((queue) => ({
        value: queue.uuid,
        label: queue.name,
      })),
    );
    queuesOptions.value = removeDuplicatedItems(
      [...queuesOptions.value, ...formattedResults],
      'value',
    );
    hasNext = next;
    if (hasNext) {
      queuesPage.value += 1;
      isLoadingQueues.value = false;
      await getQueuesOptions();
      return;
    }
    queuesPage.value = 0;
  } catch (error) {
    console.error('getQueuesOptions', error);
    queuesPage.value = 0;
  } finally {
    isLoadingQueues.value = false;
  }
}

function toCsv(values) {
  const csv = (values || [])
    .filter((value) => value && value !== 'all')
    .join(',');
  return csv || undefined;
}

function hasValidName(contact) {
  return contact?.name != null && String(contact.name).trim() !== '';
}

function contactCardName(contact) {
  if (!hasValidName(contact)) {
    return `[${t('flows_trigger.unnamed_contact')}]`;
  }
  return contact.name;
}

function getContactUrn(contact) {
  const urn = contact.urns?.[0];
  return urn ? `${urn.scheme}:${urn.path}` : '';
}

function isContactSelected(contact) {
  return !ignoredContactUuids.value.includes(contact.uuid);
}

function emitSelection() {
  const ignoredContacts = [...ignoredContactUuids.value];

  emit('update:selection', {
    sendToAll: !hasSearch.value,
    ignoredContacts: hasSearch.value ? [] : ignoredContacts,
    includedContacts: hasSearch.value ? [...includedContactUuids.value] : [],
    selectedCount: selectedCount.value,
  });
}

function toggleContact(contact) {
  if (ignoredContactUuids.value.includes(contact.uuid)) {
    ignoredContactUuids.value = ignoredContactUuids.value.filter(
      (uuid) => uuid !== contact.uuid,
    );
  } else {
    ignoredContactUuids.value = [...ignoredContactUuids.value, contact.uuid];
  }
  emitSelection();
}

async function loadContacts({ reset = true } = {}) {
  if (!reset && (isLoadingContacts.value || !contactsNext.value)) return;

  const requestId = ++contactsRequestId;
  isLoadingContacts.value = true;

  if (reset) {
    contacts.value = [];
    contactsNext.value = null;
    contactsCount.value = 0;
    ignoredContactUuids.value = [];
    emitSelection();
  }

  try {
    const response = reset
      ? await FlowsTriggerService.listOutOfWhatsappWindowContacts({
          limit: PAGE_SIZE,
          offset: 0,
          sectors: toCsv(appliedSectors.value),
          queues: toCsv(appliedQueues.value),
          search: searchContact.value || undefined,
        })
      : await FlowsTriggerService.listOutOfWhatsappWindowContacts({
          nextReq: contactsNext.value,
        });

    if (requestId !== contactsRequestId) return;

    const results = response.results || [];
    contacts.value = reset
      ? results
      : removeDuplicatedItems([...contacts.value, ...results], 'uuid');
    contactsNext.value = response.next || null;
    contactsCount.value =
      typeof response.count === 'number'
        ? response.count
        : contacts.value.length;
    emitSelection();
  } catch (error) {
    if (requestId !== contactsRequestId) return;
    console.error('loadContacts', error);
  } finally {
    if (requestId === contactsRequestId) {
      isLoadingContacts.value = false;
    }
  }
}

function loadMoreContacts() {
  loadContacts({ reset: false });
}

useInfiniteScroll(contactsListRef, loadMoreContacts, {
  distance: 40,
  canLoadMore: () => Boolean(contactsNext.value) && !isLoadingContacts.value,
});

function applyFilters() {
  appliedSectors.value = [...selectedSectors.value];
  appliedQueues.value = [...selectedQueues.value];
  isFiltersOpen.value = false;
  loadContacts();
}

function clearFilters() {
  appliedSectors.value = [];
  appliedQueues.value = [];
  selectedSectors.value = [];
  selectedQueues.value = [];
  queuesOptions.value = [];
  queuesPage.value = 0;
  isFiltersOpen.value = false;
  loadContacts();
}

function onSelectSectors(sectors) {
  selectedSectors.value = sectors;
  selectedQueues.value = [];
  queuesOptions.value = [];
  queuesPage.value = 0;

  if (sectors.length) {
    getQueuesOptions();
  }
}

watch(searchUrn, () => {
  if (timerId !== 0) clearTimeout(timerId);
  timerId = setTimeout(() => {
    if (!searchUrn.value || searchUrn.value.length >= 3) {
      searchContact.value = searchUrn.value;
      loadContacts();
    }
  }, 500);
});

onMounted(() => {
  loadContacts({ reset: true });
});

onBeforeUnmount(() => {
  if (timerId !== 0) clearTimeout(timerId);
});

defineExpose({ searchContact, loadContacts });
</script>

<style lang="scss" scoped>
.flows-trigger-expired-window {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  overflow: hidden;

  &__search {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }

  &__filters-button {
    flex-shrink: 0;
  }

  &__search-input {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__filters {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }

  &__filters-actions {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: $unnnic-space-2;
    width: 100%;
    height: 100%;
  }

  &__disclaimer {
    flex-shrink: 0;
  }

  &__contacts {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    overflow-y: auto;
  }

  &__no-results {
    color: $unnnic-color-fg-base;
    @include unnnic-font-body;
  }
}
</style>
