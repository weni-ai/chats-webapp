<template>
  <section
    class="note-card"
    data-testid="note-card"
  >
    <section
      class="note-card__content"
      @click="emit('click-note')"
    >
      <p
        v-if="agentName"
        class="note-card__agent-name"
      >
        {{ agentName }}
      </p>
      <p
        v-if="formattedText"
        class="note-card__text"
        v-html="formattedText"
      />
    </section>
    <UnnnicIcon
      v-if="canDelete"
      class="note-card__delete"
      icon="delete"
      size="ant"
      scheme="fg-critical"
      clickable
      data-testid="note-card-delete"
      @click="handleShowModalDeleteInternalNote()"
    />
    <ModalDeleteInternalNote
      v-if="showModalDeleteInternalNote"
      :modelValue="showModalDeleteInternalNote"
      :noteUuid="noteUuid"
      @update:model-value="handleShowModalDeleteInternalNote()"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfile } from '@/store/modules/profile';
import { useRooms } from '@/store/modules/chats/rooms';
import { formatMessageText } from '@/utils/string';
import ModalDeleteInternalNote from '@/components/chats/chat/ChatMessages/ChatMessageInternalNote/ModalDeleteInternalNote.vue';

defineOptions({
  name: 'NoteCard',
});

type NoteUser = {
  name?: string;
  email?: string;
};

type InternalNote = {
  uuid: string;
  text?: string;
  is_deletable?: boolean;
  user?: NoteUser;
};

type NoteMessage = InternalNote & {
  internal_note?: InternalNote;
};

const props = defineProps<{
  message: NoteMessage;
}>();

const emit = defineEmits<{
  'click-note': [];
}>();

const { me } = storeToRefs(useProfile());
const { activeRoom } = storeToRefs(useRooms());

const showModalDeleteInternalNote = ref(false);

const note = computed(() => props.message.internal_note || props.message);

const agentName = computed(() => note.value.user?.name || '');

const agentEmail = computed(
  () => props.message.internal_note?.user?.email || props.message.user?.email,
);

const formattedText = computed(() => formatMessageText(note.value.text || ''));

const noteUuid = computed(() => note.value.uuid);

const canDelete = computed(() => {
  const isMeInternalNote = me.value?.email === agentEmail.value;
  return (
    isMeInternalNote && !!note.value.is_deletable && !activeRoom.value?.ended_at
  );
});

function handleShowModalDeleteInternalNote() {
  showModalDeleteInternalNote.value = !showModalDeleteInternalNote.value;
}
</script>

<style lang="scss" scoped>
.note-card {
  display: flex;
  align-items: center;
  gap: $unnnic-space-1;
  width: 100%;

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    padding: $unnnic-space-2 $unnnic-space-4;
    background-color: $unnnic-color-bg-yellow-plain;
    border-radius: $unnnic-radius-2;
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }

  &__agent-name {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-base;
  }

  &__text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    word-break: break-word;
    max-height: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }

  &__delete {
    flex-shrink: 0;
  }
}
</style>
