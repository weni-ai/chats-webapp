import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Media from '@/services/api/resources/chats/media';

export const useContactInfos = defineStore('contactInfos', () => {
  const medias = ref([]);
  const documents = ref([]);
  const audios = ref([]);

  const isLoadingMedias = ref(false);
  const isLoadingDocuments = ref(false);
  const isLoadingAudios = ref(false);

  const mediasCursor = ref(null);
  const documentsCursor = ref(null);
  const audiosCursor = ref(null);

  const hasMoreMediasFlag = ref(true);
  const hasMoreDocumentsFlag = ref(true);
  const hasMoreAudiosFlag = ref(true);

  const currentContactUuid = ref(null);
  const currentRoomUuid = ref(null);

  const images = computed(() => {
    return medias.value.filter(
      (media) =>
        media.content_type.startsWith('image/') ||
        media.content_type.startsWith('video/'),
    );
  });

  const docs = computed(() => {
    return documents.value.filter(
      (media) =>
        !media.content_type.startsWith('image/') &&
        !media.content_type.startsWith('video/') &&
        !media.content_type.startsWith('audio/'),
    );
  });

  const hasMedias = computed(() => medias.value.length > 0);
  const hasDocuments = computed(() => documents.value.length > 0);
  const hasAudios = computed(() => audios.value.length > 0);

  const hasMoreMedias = computed(() => hasMoreMediasFlag.value);
  const hasMoreDocuments = computed(() => hasMoreDocumentsFlag.value);
  const hasMoreAudios = computed(() => hasMoreAudiosFlag.value);

  const loadMedias = async ({ contact, room, history, contactInfo }) => {
    if (!history) {
      await loadNextMedias({ contact, room });
    } else {
      await loadNextMediasClosedRoom({ contactInfo });
    }
  };

  const loadNextMedias = async ({ contact, room }) => {
    if (isLoadingMedias.value || !hasMoreMediasFlag.value) {
      return;
    }

    isLoadingMedias.value = true;
    try {
      const response = await Media.listFromContactAndRoom({
        contact,
        room,
        ordering: 'content_type',
        content_type: 'media',
        page_size: 10,
        cursor: mediasCursor.value,
      });

      medias.value = medias.value.concat(
        response.results.filter(
          (media) =>
            media.content_type.startsWith('image/') ||
            media.content_type.startsWith('video/'),
        ),
      );

      mediasCursor.value = response.nextCursor;
      hasMoreMediasFlag.value = response.next !== null;
    } finally {
      isLoadingMedias.value = false;
    }
  };

  const loadNextMediasClosedRoom = async ({ contactInfo }) => {
    if (isLoadingMedias.value || !hasMoreMediasFlag.value) {
      return;
    }

    isLoadingMedias.value = true;
    try {
      const response = await Media.listFromContactAndClosedRoom({
        ordering: 'content_type',
        contact: contactInfo,
        page_size: 10,
        cursor: mediasCursor.value,
        content_type: 'media',
      });

      medias.value = medias.value.concat(
        response.results.filter(
          (media) =>
            media.content_type.startsWith('image/') ||
            media.content_type.startsWith('video/'),
        ),
      );

      mediasCursor.value = response.nextCursor;
      hasMoreMediasFlag.value = response.next !== null;
    } finally {
      isLoadingMedias.value = false;
    }
  };

  const loadDocuments = async ({ contact, room, history, contactInfo }) => {
    if (!history) {
      await loadNextDocuments({ contact, room });
    } else {
      await loadNextDocumentsClosedRoom({ contactInfo });
    }
  };

  const loadNextDocuments = async ({ contact, room }) => {
    if (isLoadingDocuments.value || !hasMoreDocumentsFlag.value) {
      return;
    }

    isLoadingDocuments.value = true;
    try {
      const response = await Media.listFromContactAndRoom({
        contact,
        room,
        ordering: 'content_type',
        content_type: 'documents',
        page_size: 10,
        cursor: documentsCursor.value,
      });

      documents.value = documents.value.concat(
        response.results.filter(
          (media) =>
            !media.content_type.startsWith('image/') &&
            !media.content_type.startsWith('video/') &&
            !media.content_type.startsWith('audio/'),
        ),
      );

      documentsCursor.value = response.nextCursor;
      hasMoreDocumentsFlag.value = response.next !== null;
    } finally {
      isLoadingDocuments.value = false;
    }
  };

  const loadNextDocumentsClosedRoom = async ({ contactInfo }) => {
    if (isLoadingDocuments.value || !hasMoreDocumentsFlag.value) {
      return;
    }

    isLoadingDocuments.value = true;
    try {
      const response = await Media.listFromContactAndClosedRoom({
        ordering: 'content_type',
        contact: contactInfo,
        content_type: 'documents',
        page_size: 10,
        cursor: documentsCursor.value,
      });

      documents.value = documents.value.concat(
        response.results.filter(
          (media) =>
            !media.content_type.startsWith('image/') &&
            !media.content_type.startsWith('video/') &&
            !media.content_type.startsWith('audio/'),
        ),
      );

      documentsCursor.value = response.nextCursor;
      hasMoreDocumentsFlag.value = response.next !== null;
    } finally {
      isLoadingDocuments.value = false;
    }
  };

  const loadAudios = async ({ contact, room, history, contactInfo }) => {
    if (!history) {
      await loadNextAudios({ contact, room });
    } else {
      await loadNextAudiosClosedRoom({ contactInfo });
    }
  };

  const loadNextAudios = async ({ contact, room }) => {
    if (isLoadingAudios.value || !hasMoreAudiosFlag.value) {
      return;
    }

    isLoadingAudios.value = true;
    try {
      const response = await Media.listFromContactAndRoom({
        contact,
        room,
        ordering: 'content_type',
        content_type: 'audio',
        page_size: 10,
        cursor: audiosCursor.value,
      });

      const newAudios = await Promise.all(
        response.results
          .filter((media) => media.content_type.startsWith('audio/'))
          .map(
            (element) =>
              new Promise((resolve) => {
                const url = new Audio(element.url);
                url.onloadedmetadata = (event) => {
                  if (event.path) {
                    const { duration } = event.path[0];
                    resolve({ ...element, duration });
                  } else {
                    const duration = Math.round(url.duration);
                    resolve({ ...element, duration });
                  }
                };
              }),
          ),
      );

      audios.value = audios.value.concat(newAudios);

      audiosCursor.value = response.nextCursor;
      hasMoreAudiosFlag.value = response.next !== null;
    } finally {
      isLoadingAudios.value = false;
    }
  };

  const loadNextAudiosClosedRoom = async ({ contactInfo }) => {
    if (isLoadingAudios.value || !hasMoreAudiosFlag.value) {
      return;
    }

    isLoadingAudios.value = true;
    try {
      const response = await Media.listFromContactAndClosedRoom({
        ordering: 'content_type',
        contact: contactInfo,
        content_type: 'audio',
        page_size: 10,
        cursor: audiosCursor.value,
      });

      const newAudios = await Promise.all(
        response.results
          .filter((media) => media.content_type.startsWith('audio/'))
          .map(
            (element) =>
              new Promise((resolve) => {
                const url = new Audio(element.url);
                url.onloadedmetadata = (event) => {
                  if (event.path) {
                    const { duration } = event.path[0];
                    resolve({ ...element, duration });
                  } else {
                    const duration = Math.round(url.duration);
                    resolve({ ...element, duration });
                  }
                };
              }),
          ),
      );

      audios.value = audios.value.concat(newAudios);

      audiosCursor.value = response.nextCursor;
      hasMoreAudiosFlag.value = response.next !== null;
    } finally {
      isLoadingAudios.value = false;
    }
  };

  const setCurrentContact = (contactUuid, roomUuid) => {
    currentContactUuid.value = contactUuid;
    currentRoomUuid.value = roomUuid;
  };

  const clearAll = () => {
    medias.value = [];
    documents.value = [];
    audios.value = [];
    mediasCursor.value = null;
    documentsCursor.value = null;
    audiosCursor.value = null;
    hasMoreMediasFlag.value = true;
    hasMoreDocumentsFlag.value = true;
    hasMoreAudiosFlag.value = true;
    currentContactUuid.value = null;
    currentRoomUuid.value = null;
  };

  return {
    medias,
    documents,
    audios,
    isLoadingMedias,
    isLoadingDocuments,
    isLoadingAudios,
    mediasCursor,
    documentsCursor,
    audiosCursor,
    currentContactUuid,
    currentRoomUuid,

    images,
    docs,
    hasMedias,
    hasDocuments,
    hasAudios,
    hasMoreMedias,
    hasMoreDocuments,
    hasMoreAudios,

    loadMedias,
    loadNextMedias,
    loadNextMediasClosedRoom,
    loadDocuments,
    loadNextDocuments,
    loadNextDocumentsClosedRoom,
    loadAudios,
    loadNextAudios,
    loadNextAudiosClosedRoom,
    setCurrentContact,
    clearAll,
  };
});
