<template>
  <unnnic-tab v-model="tab" :tabs="tabs">
    <template slot="tab-head-media">
      <div class="media-tab" :class="{ active: isActiveTab('media') }">
        <span class="name">Mídia</span>
        <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
      </div>
    </template>

    <template slot="tab-panel-media">
      <section class="media__content">
        <div v-for="media in medias" :key="media.filename" class="media__content__media">
          <div class="media__content__media__preview">
            <image-preview v-bind="media" fullscreen-on-click object-fit="cover" />
          </div>
        </div>
      </section>
    </template>

    <template slot="tab-head-docs">
      <div class="media-tab" :class="{ active: isActiveTab('docs') }">
        <span class="name">Documentos</span>
        <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
      </div>
    </template>

    <template slot="tab-panel-docs">
      <section class="documents__content">
        <document-preview
          v-for="document in documents"
          size="sm"
          :key="document.filename"
          :src="document.src"
          :fullFilename="document.filename + '.' + document.fileExtension"
          class="documents__content__document"
        />
      </section>
    </template>
  </unnnic-tab>
</template>

<script>
import DocumentPreview from '@/components/chats/MediaMessage/Previews/Document';
import ImagePreview from '@/components/chats/MediaMessage/Previews/Image';

export default {
  name: 'ContactMedia',

  components: {
    DocumentPreview,
    ImagePreview,
  },

  data: () => ({
    tab: 'media',
    tabs: ['media', 'docs'],

    documents: [
      {
        src: 'https://picsum.photos/2480/3508',
        type: 'document',
        isMedia: true,
        fileExtension: 'pdf',
        filename: 'Boleto atualizado 1',
      },
      {
        src: 'https://picsum.photos/2480/3508',
        type: 'document',
        isMedia: true,
        fileExtension: 'pdf',
        filename: 'Boleto atualizado 2',
      },
      {
        src: 'https://picsum.photos/2480/3508',
        type: 'document',
        isMedia: true,
        fileExtension: 'pdf',
        filename: 'Boleto atualizado 3',
      },
      {
        src: 'https://picsum.photos/2480/3508',
        type: 'document',
        isMedia: true,
        fileExtension: 'pdf',
        filename: 'Boleto atualizado 4',
      },
    ],

    medias: [
      {
        src: 'https://picsum.photos/1920/1080',
        type: 'image',
        isMedia: true,
        fileExtension: 'png',
        filename: 'Captura de tela 1',
      },
      {
        src: 'https://picsum.photos/1080/1920',
        type: 'image',
        isMedia: true,
        width: 1080,
        height: 'auto',
        fileExtension: 'png',
        filename: 'Captura de tela 2',
      },
      {
        src: 'https://picsum.photos/1920/1080',
        type: 'image',
        isMedia: true,
        fileExtension: 'png',
        filename: 'Captura de tela 3',
      },
      {
        src: 'https://picsum.photos/500/500',
        type: 'image',
        isMedia: true,
        fileExtension: 'png',
        filename: 'Captura de tela 4',
      },
      {
        src: 'https://picsum.photos/1920/1080',
        type: 'image',
        isMedia: true,
        fileExtension: 'png',
        filename: 'Captura de tela 5',
      },
      {
        src: 'https://picsum.photos/1920/1080',
        type: 'image',
        isMedia: true,
        fileExtension: 'png',
        filename: 'Captura de tela 6',
      },
      {
        src: 'https://picsum.photos/1920/1080',
        type: 'image',
        isMedia: true,
        fileExtension: 'png',
        filename: 'Captura de tela 7',
      },
    ],
  }),

  methods: {
    isActiveTab(tab) {
      return tab === this.tab;
    },
  },
};
</script>

<style lang="scss" scoped>
.media-tab {
  display: flex;
  align-items: center;
  gap: $unnnic-spacing-stack-xs;

  &.active {
    .name {
      color: $unnnic-color-aux-purple;
    }
  }

  .name {
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-cloudy;
  }
}

.media__content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $unnnic-spacing-stack-xs;

  max-width: 100%;

  &__media {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;

    &__preview {
      height: 100%;
      width: 100%;
    }
  }
}

.documents__content {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;

  &__document {
    padding-bottom: 0.25rem;
    border-bottom: solid 1px $unnnic-color-neutral-soft;
  }
}
</style>
