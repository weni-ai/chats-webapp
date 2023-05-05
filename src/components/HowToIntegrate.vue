<template>
  <unnnic-modal-next v-if="isOpen" @close="isOpen = false" show-close-button>
    <div class="modal--title u font secondary title-sm black color-neutral-darkest">
      {{ $t('how_to_integrate.title') }}
    </div>

    <div class="slide">
      <div class="slide--item" :style="styleForStep(0)">
        <img class="slide--item--image" src="@/assets/how_to_integrate.gif" alt="" />

        <div class="slide--item u font secondary body-lg color-neutral-cloudy">
          <ol>
            <li v-for="i in 4" :key="i" v-html="$t(`how_to_integrate.item_${i}`)"></li>
          </ol>
        </div>

        <div class="actions">
          <unnnic-button @click="step += 1" type="secondary">
            {{ $t('how_to_integrate.buttons.next') }}
          </unnnic-button>
        </div>
      </div>

      <div class="slide--item" :style="styleForStep(1)">
        <img class="slide--item--image" src="@/assets/how_to_integrate_2.gif" alt="" />

        <div class="u font secondary body-lg color-neutral-cloudy">
          <ol start="5">
            <li v-for="i in 4" :key="i" v-html="$t(`how_to_integrate.item_${4 + i}`)"></li>
          </ol>
        </div>

        <div class="actions">
          <unnnic-button @click="step -= 1" type="terciary">
            {{ $t('how_to_integrate.buttons.previous') }}
          </unnnic-button>

          <unnnic-button @click="redirectToSettings" type="secondary">
            {{ $t('how_to_integrate.buttons.start') }}
          </unnnic-button>
        </div>
      </div>
    </div>
  </unnnic-modal-next>
</template>

<script>
import iframessa from 'iframessa';

export default {
  data() {
    return {
      isOpen: false,
      isAlreadyShowed: false,
      step: 0,
    };
  },

  created() {
    iframessa.get('isOpenHowToIntegrateChatsModal', this.recievedIsOpen);
    iframessa.on('update:isOpenHowToIntegrateChatsModal', this.recievedIsOpen);
  },

  methods: {
    styleForStep(stepToCompare) {
      return {
        transform: `scale(${this.step > stepToCompare ? 0 : 1})`,
        marginLeft: `${this.step >= stepToCompare && stepToCompare !== 0 ? -100 : 0}%`,
      };
    },

    redirectToSettings() {
      iframessa.emit('redirectToSettingsChats', { path: 'init' });
    },

    recievedIsOpen({ data: open }) {
      if (this.isAlreadyShowed || !open) {
        return;
      }

      this.isOpen = true;
      this.isAlreadyShowed = true;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~@weni/unnnic-system/src/assets/scss/unnnic.scss';

.unnnic-modal ::v-deep > .container > .content {
  box-sizing: initial;
}

ol {
  list-style-type: decimal;
  margin: 0;
  padding-left: $unnnic-spacing-inline-md;
}

.modal--title {
  text-align: center;
  margin-bottom: $unnnic-spacing-stack-sm;
}

.slide {
  position: relative;
  display: flex;
  overflow-x: hidden;

  &--item {
    min-width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: margin-left 200ms, transform 200ms;
    transform: scale(1);

    &--image {
      width: 81.6777778%;
      aspect-ratio: 367.55 / 167;
      object-fit: cover;
      margin: 0 auto;
      margin-bottom: $unnnic-spacing-stack-md;
    }

    .actions {
      margin-top: $unnnic-spacing-stack-giant;
      display: flex;
      column-gap: $unnnic-spacing-inline-lg;

      .unnnic-button {
        flex: 1;
      }
    }
  }
}
</style>
