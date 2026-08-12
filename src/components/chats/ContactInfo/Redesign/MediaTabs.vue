<template>
  <UnnnicTab
    v-model="activeTab"
    size="md"
    :tabs="tabsKeys"
    class="contact-info-redesign-media"
    data-testid="contact-info-redesign-media"
  >
    <template
      v-for="key in Object.keys(tabs)"
      #[`tab-head-${key}`]
      :key="`tab-head-${key}`"
    >
      {{ $t(tabs[key].name) }}
    </template>

    <template
      v-for="key in Object.keys(tabs) as TabKey[]"
      #[`tab-panel-${key}`]
      :key="`tab-panel-${key}`"
    >
      <component
        :is="tabs[key].component"
        v-if="room?.uuid"
        :data-testid="`tab-panel-${key}`"
        v-bind="getComponentProps(key)"
        v-on="getComponentEvents(key)"
      />
    </template>
  </UnnnicTab>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, type Component } from 'vue';
import NotesTabContent from './NotesTabContent.vue';
import MediasContent from '../tabs/MediasContent.vue';
import DocumentsContent from '../tabs/DocumentsContent.vue';
import AudiosContent from '../tabs/AudiosContent.vue';
import { useContactInfos } from '@/store/modules/chats/contactInfos';

defineOptions({
  name: 'ContactInfoRedesignMediaTabs',
});

type Room = {
  uuid?: string;
  [key: string]: unknown;
};

type ContactInfo = Record<string, unknown>;

type TabKey = 'notes' | 'media' | 'docs' | 'audio';

type TabPropName = 'room' | 'contactInfo' | 'history';

type TabConfig = {
  name: string;
  component: Component;
  props: TabPropName[];
  events: Array<'loaded' | 'fullscreen'>;
};

type MediaItem = {
  url: string;
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    room?: Room;
    contactInfo?: ContactInfo;
    history?: boolean;
  }>(),
  {
    room: () => ({}),
    contactInfo: () => ({}),
    history: false,
  },
);

const emit = defineEmits<{
  fullscreen: [url: string, images: MediaItem[]];
  'loaded-medias': [];
}>();

const contactInfosStore = useContactInfos();

const activeTab = ref<TabKey>('notes');

const tabs: Record<TabKey, TabConfig> = {
  notes: {
    name: 'notes',
    component: NotesTabContent,
    props: ['room'],
    events: ['loaded'],
  },
  media: {
    name: 'medias',
    component: MediasContent,
    props: ['room', 'contactInfo', 'history'],
    events: ['fullscreen', 'loaded'],
  },
  docs: {
    name: 'docs',
    component: DocumentsContent,
    props: ['room', 'contactInfo', 'history'],
    events: ['loaded'],
  },
  audio: {
    name: 'audios',
    component: AudiosContent,
    props: ['room', 'contactInfo', 'history'],
    events: ['loaded'],
  },
};

const tabsKeys = computed(() => Object.keys(tabs) as TabKey[]);

const getComponentProps = (tabKey: TabKey) => {
  const tab = tabs[tabKey];
  const componentProps: Record<string, unknown> = {};

  tab.props.forEach((propName) => {
    if (propName in props) {
      componentProps[propName] = props[propName];
    }
  });

  return componentProps;
};

const getComponentEvents = (tabKey: TabKey) => {
  const tab = tabs[tabKey];
  const events: Record<string, (...args: unknown[]) => void> = {};

  tab.events.forEach((eventName) => {
    if (eventName === 'fullscreen') {
      events.fullscreen = handleFullscreen as (...args: unknown[]) => void;
    } else if (eventName === 'loaded') {
      events.loaded = handleTabLoaded;
    }
  });

  return events;
};

const handleFullscreen = (url: string, images: MediaItem[]) => {
  emit('fullscreen', url, images);
};

const handleTabLoaded = () => {
  emit('loaded-medias');
};

onUnmounted(() => {
  contactInfosStore.clearAll();
});
</script>

<style lang="scss" scoped>
.contact-info-redesign-media {
  :deep(.tab-content) {
    gap: $unnnic-space-0;
  }
}
</style>
