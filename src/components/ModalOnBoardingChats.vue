<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/anchor-has-content -->
<template>
  <div class="modal">
    <div class="modal-container">
      <div class="modal-container-background">
        <div class="modal-background-color">
          <div class="header">
            <unnnic-card
              class="unnnic-grid-span-4"
              type="title"
              icon="study-light-idea-1"
              :title="$t('on_boarding.title')"
              info-position="bottom"
              scheme="aux-purple"
              :info="$t('on_boarding.tooltip')"
            />
          </div>
          <div class="content">
            <div class="on-boarding-chat">
              <div class="slide" ref="slide">
                <div
                  :style="{ width: `${100 * pages}%` }"
                  class="pages"
                  ref="pages"
                  @focus="startAutoSkip"
                  @blur="cancelAutoSkip"
                  @mouseenter.self="cancelAutoSkip"
                  @mouseleave.self="startAutoSkip"
                >
                  <div class="page">
                    <div class="image" @click="redirectToSettings">
                      <img src="@/assets/OnBoardingChats/onBoardingChatSectorImage.png" />
                    </div>
                    <div class="title">{{ $t('on_boarding.title_sector') }}</div>
                    <div class="description">{{ $t('on_boarding.description_sector') }}</div>
                  </div>
                  <div class="page">
                    <div class="image" @click="redirectToSettings">
                      <img src="@/assets/OnBoardingChats/onBoardingChatRowImage.png" />
                    </div>
                    <div class="title">{{ $t('on_boarding.title_queues') }}</div>
                    <div class="description">{{ $t('on_boarding.description_queues') }}</div>
                  </div>
                  <div class="page">
                    <div class="image" @click="redirectToSettings">
                      <img src="@/assets/OnBoardingChats/onBoardingChatTagsImage.png" />
                    </div>
                    <div class="title">{{ $t('on_boarding.title_tags') }}</div>
                    <div class="description">{{ $t('on_boarding.description_tags') }}</div>
                  </div>
                </div>
              </div>

              <div class="controlers">
                <unnnic-icon
                  icon="arrow-left-1-1"
                  size="sm"
                  scheme="neutral-clean"
                  clickable
                  @click="
                    resetAutoSkip();
                    previous();
                  "
                />

                <div class="pages">
                  <div
                    v-for="page in pages"
                    :key="page"
                    :class="['page', { active: currentPage === page - 1 }]"
                    @click="
                      resetAutoSkip();
                      goToSpecificPage(page - 1);
                    "
                  ></div>
                </div>

                <unnnic-icon
                  icon="arrow-right-1-1"
                  size="sm"
                  scheme="neutral-clean"
                  clickable
                  @click="
                    resetAutoSkip();
                    next();
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      pages: 3,
      currentPage: 0,
      autoSkip: null,
    };
  },
  mounted() {
    this.startAutoSkip();
  },

  methods: {
    open(src) {
      window.open(src);
    },

    scroll(index) {
      this.$refs.slide.scroll({
        top: 0,
        left: (this.$refs.slide.scrollWidth / this.pages) * index,
        behavior: 'smooth',
      });
    },

    next() {
      this.currentPage = (this.currentPage + 1) % this.pages;

      this.scroll(this.currentPage);
    },

    previous() {
      this.currentPage -= 1;

      if (this.currentPage < 0) {
        this.currentPage = this.pages - 1;
      }

      this.scroll(this.currentPage);
    },

    goToSpecificPage(page) {
      this.currentPage = page;

      this.scroll(this.currentPage);
    },

    cancelAutoSkip() {
      clearInterval(this.autoSkip);
    },

    startAutoSkip() {
      this.autoSkip = setInterval(this.next, 7000);
    },

    resetAutoSkip() {
      this.cancelAutoSkip();
      this.startAutoSkip();
    },
    redirectToSettings() {
      window.parent.postMessage({ event: 'chats:redirect', path: 'chats-settings:settings' }, '*');
    },
  },

  beforeDestroy() {
    this.cancelAutoSkip();
  },
};
</script>

<style lang="scss" scoped>
@import '~@weni/unnnic-system/src/assets/scss/unnnic.scss';

.modal {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}

.modal-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.modal-container-background {
  width: 65rem;
  box-shadow: 0 8px 16px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  border-radius: 0.25rem;
  overflow: hidden;
}
.modal-background-color {
  min-height: 35rem;
  background-color: #f9f9f9;
  padding: 0 1.5rem;
  text-align: center;
}

.header {
  font-weight: $unnnic-font-weight-regular;
  font-size: $unnnic-font-size-title-sm;
  font-family: $unnnic-font-family-primary;
  padding: 1rem;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  text-overflow: ellipsis;
}

.on-boarding-chat {
  .slide {
    width: 100%;
    overflow: hidden;

    .pages {
      display: flex;

      .page {
        flex: 1;

        img {
          width: 100%;
          border-radius: $unnnic-border-radius-sm;
          margin-bottom: $unnnic-spacing-stack-sm;
          aspect-ratio: 629 / 232;
          object-fit: cover;
          cursor: pointer;
        }

        .title {
          font-family: $unnnic-font-family-secondary;
          color: $unnnic-color-neutral-dark;
          font-weight: $unnnic-font-weight-bold;
          line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
          margin-bottom: $unnnic-spacing-stack-xs;
          display: flex;
        }

        .description {
          font-family: $unnnic-font-family-secondary;
          color: $unnnic-color-neutral-dark;
          font-weight: $unnnic-font-weight-regular;
          line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
          display: flex;
          text-align: initial;
        }
      }
    }
  }

  .controlers {
    display: flex;
    padding: 1rem;
    align-items: center;
    justify-content: center;
    margin-top: $unnnic-spacing-stack-sm;

    .pages {
      margin: 0 $unnnic-spacing-inline-sm;
      display: flex;
      column-gap: $unnnic-spacing-inline-xs;

      .page {
        cursor: pointer;
        width: 0.25rem;
        height: 0.25rem;
        border-radius: 0.25rem;
        background-color: rgba($unnnic-color-neutral-clean, $unnnic-opacity-level-overlay);
        transition: all 0.5s;

        &.active {
          width: 1rem;
          background-color: $unnnic-color-neutral-clean;
        }
      }
    }
  }
}
</style>
