<template>
  <UnnnicTab
    v-model="activeTab"
    size="md"
    :tabs="tabsKeys"
    class="contact-info-media"
  >
    <template
      v-for="key in Object.keys(tabs)"
      #[`tab-head-${key}`]
      :key="`tab-head-${key}`"
    >
      {{ $t(tabs[key].name) }}
    </template>

    <template
      v-for="key in Object.keys(tabs)"
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

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import NotesContent from './tabs/NotesContent.vue';
import MediasContent from './tabs/MediasContent.vue';
import DocumentsContent from './tabs/DocumentsContent.vue';
import AudiosContent from './tabs/AudiosContent.vue';
import { useContactInfos } from '@/store/modules/chats/contactInfos';

const props = defineProps({
  room: {
    type: Object,
    default: () => {},
  },
  contactInfo: {
    type: Object,
    default: () => {},
  },
  history: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['fullscreen', 'loaded-medias']);

const contactInfosStore = useContactInfos();

const activeTab = ref('notes');

const tabs = {
  notes: {
    name: 'notes',
    component: NotesContent,
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

const tabsKeys = computed(() => Object.keys(tabs));

const getComponentProps = (tabKey) => {
  const tab = tabs[tabKey];
  const componentProps = {};

  tab.props.forEach((propName) => {
    if (propName in props) {
      componentProps[propName] = props[propName];
    }
  });

  return componentProps;
};

const getComponentEvents = (tabKey) => {
  const tab = tabs[tabKey];
  const events = {};

  tab.events.forEach((eventName) => {
    if (eventName === 'fullscreen') {
      events.fullscreen = handleFullscreen;
    } else if (eventName === 'loaded') {
      events.loaded = handleTabLoaded;
    }
  });

  return events;
};

const handleFullscreen = (url, images) => {
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
.contact-info-media {
  :deep(.tab-content) {
    gap: 0px;
  }
}
</style>
