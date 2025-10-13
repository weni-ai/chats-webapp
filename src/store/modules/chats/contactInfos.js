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

  const loadMedias = async ({ contact, room, history, contactInfo }) => {
    isLoadingMedias.value = true;
    if (!history) {
      await loadNextMedias({ contact, room });
    } else {
      await loadNextMediasClosedRoom({ contactInfo });
    }
    isLoadingMedias.value = false;
  };

  const loadNextMedias = async ({ contact, room }) => {
    const response = await Media.listFromContactAndRoom({
      contact,
      room,
      ordering: 'content_type',
      content_type: 'media',
      page_size: 5,
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

    if (response.next) {
      await loadNextMedias({ contact, room });
    }
  };

  const loadNextMediasClosedRoom = async ({ contactInfo }) => {
    const response = await Media.listFromContactAndClosedRoom({
      ordering: 'content_type',
      contact: contactInfo,
      page_size: 5,
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

    if (response.next) {
      await loadNextMediasClosedRoom({ contactInfo });
    }
  };

  const loadDocuments = async ({ contact, room, history, contactInfo }) => {
    isLoadingDocuments.value = true;
    if (!history) {
      await loadNextDocuments({ contact, room });
    } else {
      await loadNextDocumentsClosedRoom({ contactInfo });
    }
    isLoadingDocuments.value = false;
  };

  const loadNextDocuments = async ({ contact, room }) => {
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

    if (response.next) {
      await loadNextDocuments({ contact, room });
    }
  };

  const loadNextDocumentsClosedRoom = async ({ contactInfo }) => {
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

    if (response.next) {
      await loadNextDocumentsClosedRoom({ contactInfo });
    }
  };

  const loadAudios = async ({ contact, room, history, contactInfo }) => {
    isLoadingAudios.value = true;
    if (!history) {
      await loadNextAudios({ contact, room });
    } else {
      await loadNextAudiosClosedRoom({ contactInfo });
    }
    isLoadingAudios.value = false;
  };

  const loadNextAudios = async ({ contact, room }) => {
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

    if (response.next) {
      await loadNextAudios({ contact, room });
    }
  };

  const loadNextAudiosClosedRoom = async ({ contactInfo }) => {
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

    if (response.next) {
      await loadNextAudiosClosedRoom({ contactInfo });
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

    loadMedias,
    loadDocuments,
    loadAudios,
    setCurrentContact,
    clearAll,
  };
});
