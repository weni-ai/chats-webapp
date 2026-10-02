<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <section class="flows-trigger-all-contacts">
    <header class="flows-trigger__header">
      <UnnnicInput
        v-model="searchUrn"
        iconLeft="search-1"
        :placeholder="$t('chats.search_contact')"
        data-testid="flows-trigger-search"
      />
    </header>

    <SelectedContactsSection
      :contacts="selectedContacts"
      @click="$emit('select-contact', $event)"
      @remove-contact="$emit('remove-contact', $event)"
    />

    <section
      class="flows-trigger__groups"
      @scroll="handleScroll($event.srcElement)"
    >
      <section
        v-if="openedRoomsAlerts.length > 0"
        class="flows-trigger__contact-alerts"
      >
        <UnnnicDisclaimer
          v-for="contact in openedRoomsAlerts"
          :key="contact.contactName"
          type="attention"
          :description="alreadyOpenRoomMessage(contact)"
          data-testid="flows-trigger-already-open"
        />
      </section>

      <FlowsContactsLoading v-show="isContactsLoading" />

      <p
        v-if="showNoResults"
        class="flows-trigger__groups__no-results"
      >
        {{ $t('without_results') }}
      </p>

      <section v-show="!isContactsLoading">
        <template v-for="(element, letter) in lettersWithoutUnnamed">
          <!-- eslint-disable-next-line vue/valid-v-for -->
          <UnnnicCollapse
            v-model="letterColapse[letter]"
            class="flows-trigger__groups__group"
            :title="
              $t('flows_trigger.letter_group', {
                letter,
                length: element?.length || 0,
              })
            "
          >
            <FlowsContactCard
              v-for="item in element"
              :key="item.uuid"
              class="flows-trigger__groups__group__contact"
              :name="item.name"
              :subtitle="getContactUrn(item)"
              :selected="selected.some((search) => search.uuid === item.uuid)"
              @toggle="$emit('toggle', item)"
            />
          </UnnnicCollapse>
        </template>
        <template v-if="letters['unnamed_contact']">
          <UnnnicCollapse
            v-model="letterColapse['unnamed_contact']"
            class="flows-trigger__groups__group"
            :title="
              $t('flows_trigger.letter_group_unnamed', {
                length: letters['unnamed_contact']?.length || 0,
              })
            "
          >
            <FlowsContactCard
              v-for="item in letters['unnamed_contact']"
              :key="item.uuid"
              class="flows-trigger__groups__group__contact"
              :name="`[${$t('flows_trigger.unnamed_contact')}]`"
              :subtitle="getContactUrn(item)"
              :selected="selected.some((search) => search.uuid === item.uuid)"
              unnamed
              @toggle="$emit('toggle', item)"
            />
          </UnnnicCollapse>
        </template>
      </section>
    </section>
  </section>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

import SelectedContactsSection from '@/components/chats/FlowsTrigger/SelectedContactsSection.vue';
import FlowsContactCard from '@/components/chats/FlowsTrigger/FlowsContactCard.vue';
import FlowsContactsLoading from '@/views/loadings/FlowsTrigger/FlowsContactsLoading.vue';
import FlowsAPI from '@/services/api/resources/flows/flowsTrigger.js';

defineOptions({
  name: 'FlowsTriggerAllContacts',
});

const props = defineProps({
  projectUuidFlow: {
    type: String,
    default: '',
  },
  selectedContacts: {
    type: Array,
    default: () => [],
  },
  openedRoomsAlerts: {
    type: Array,
    default: () => [],
  },
  selected: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['toggle', 'select-contact', 'remove-contact']);

const { t } = useI18n();

const letterColapse = reactive({});
const isContactsLoading = ref(true);
const search = ref('');
const searchUrn = ref('');
const listOfContacts = ref([]);
const hasNext = ref(null);
let timerId = 0;

const showNoResults = computed(
  () =>
    !isContactsLoading.value &&
    !!searchUrn.value &&
    listOfContacts.value.length === 0,
);

const letters = computed(() => {
  const grouped = {};
  const UNNAMED_KEY = 'unnamed_contact';

  const hasValidName = (item) =>
    item.name != null && String(item.name).trim() !== '';

  const getGroupKey = (element) => {
    if (!hasValidName(element)) return UNNAMED_KEY;
    const first = element.name[0];
    return /\d/.test(first)
      ? first
      : first
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
  };

  listOfContacts.value
    .filter(
      (item) =>
        item.urns?.[0] &&
        (hasValidName(item)
          ? item.name.toUpperCase().includes(search.value.toUpperCase())
          : true),
    )
    .forEach((element) => {
      const groupKey = getGroupKey(element);

      grouped[groupKey] = grouped[groupKey] || [];

      const contactAlreadyExist = grouped[groupKey].some((pushedContact) =>
        pushedContact.urns.some((pushedUrn) =>
          element.urns.some(
            (elementUrn) =>
              elementUrn.scheme === pushedUrn.scheme &&
              elementUrn.path === pushedUrn.path,
          ),
        ),
      );

      if (!contactAlreadyExist) grouped[groupKey].push(element);
      if (letterColapse[groupKey] === undefined) {
        letterColapse[groupKey] = true;
      }
    });

  return grouped;
});

const lettersWithoutUnnamed = computed(() =>
  Object.keys(letters.value).reduce((acc, key) => {
    if (key !== 'unnamed_contact') {
      acc[key] = letters.value[key];
    }
    return acc;
  }, {}),
);

async function contactList(next, cleanList = false) {
  if (!searchUrn.value || searchUrn.value.length >= 3) {
    if (cleanList) listOfContacts.value = [];
    isContactsLoading.value = true;
    try {
      const response = await FlowsAPI.getContacts(
        searchUrn.value,
        props.projectUuidFlow,
      );

      listOfContacts.value = listOfContacts.value
        .concat(response.data?.results || [])
        .filter((contact) => contact);

      hasNext.value = response.next;

      listOfContacts.value.sort((a, b) => a.name?.localeCompare(b.name));
    } catch (error) {
      console.error('contactList', error);
    } finally {
      isContactsLoading.value = false;
    }
  }
}

function searchForMoreContacts() {
  if (hasNext.value) {
    contactList(hasNext.value, false);
  }
}

function handleScroll(target) {
  // Pagination temporarily removed, remove the condition below to work again.
  if (hasNext.value || !hasNext.value) return;

  if (isContactsLoading.value) return;
  if (
    target.offsetHeight + Math.ceil(target.scrollTop) >=
    target.scrollHeight
  ) {
    searchForMoreContacts();
  }
}

function getContactUrn(item) {
  const urn = item.urns?.[0];
  return urn ? `${urn?.scheme}:${urn?.path}` : '';
}

function alreadyOpenRoomMessage(contact) {
  const opening = t('flows_trigger.already_open_room.open', {
    contact: contact.contactName,
  });

  const detail = contact.agent
    ? t('flows_trigger.already_open_room.with_agent', {
        agent: contact.agent,
        queue: contact.queue,
      })
    : t('flows_trigger.already_open_room.in_queue_awaiting', {
        queue: contact.queue,
      });

  return `${opening} ${detail}`;
}

watch(searchUrn, () => {
  if (timerId !== 0) clearTimeout(timerId);
  timerId = setTimeout(() => {
    contactList(null, true);
  }, 500);
});

watch(
  () => props.projectUuidFlow,
  (newProjectUuidFlow) => {
    if (newProjectUuidFlow) {
      contactList();
    }
  },
);

onMounted(() => {
  contactList();
});

onBeforeUnmount(() => {
  if (timerId !== 0) clearTimeout(timerId);
});

defineExpose({ contactList });
</script>

<style lang="scss" scoped>
.flows-trigger-all-contacts {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > * {
    flex-shrink: 0;
  }

  > * + * {
    margin-top: $unnnic-space-4;
  }

  > .flows-trigger__groups {
    flex: 1 1 auto;
    min-height: 0;
  }
}

.flows-trigger__header {
  display: grid;
  gap: $unnnic-space-4;
}

.flows-trigger__groups {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  overflow-y: auto;

  margin-right: -$unnnic-space-2;
  padding-right: $unnnic-space-2;

  &__group__contact {
    &:not(:last-of-type) {
      margin-bottom: $unnnic-space-3;
    }
  }

  &__no-results {
    color: $unnnic-color-fg-base;
    @include unnnic-font-body;
  }
}

.flows-trigger__contact-alerts {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
}
</style>
