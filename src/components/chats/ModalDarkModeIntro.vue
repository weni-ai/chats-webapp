<template>
  <UnnnicDialog
    v-model:open="model"
    class="dark-mode-intro"
    data-testid="dark-mode-intro-modal"
  >
    <UnnnicDialogContent
      size="large"
      class="dark-mode-intro__content"
    >
      <UnnnicDialogHeader>
        <UnnnicDialogTitle data-testid="dark-mode-intro-title">
          {{ $t('dark_mode_intro.title') }} 🌙
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <section class="dark-mode-intro__body">
        <p
          class="dark-mode-intro__paragraph"
          data-testid="dark-mode-intro-description-1"
        >
          {{ $t('dark_mode_intro.description_1') }}
        </p>
        <p
          class="dark-mode-intro__paragraph"
          data-testid="dark-mode-intro-description-2"
        >
          {{ $t('dark_mode_intro.description_2') }}
        </p>
        <img
          :src="darkModePreview"
          alt=""
          class="dark-mode-intro__preview"
          data-testid="dark-mode-intro-preview"
        />
        <p
          class="dark-mode-intro__tagline"
          data-testid="dark-mode-intro-tagline"
        >
          {{ $t('dark_mode_intro.tagline') }}
        </p>
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('dark_mode_intro.buttons.not_now')"
          type="tertiary"
          data-testid="dark-mode-intro-not-now"
          @click="dismiss"
        />
        <UnnnicButton
          :text="$t('dark_mode_intro.buttons.switch')"
          type="primary"
          data-testid="dark-mode-intro-switch"
          @click="switchToDark"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme, unnnicToastManager } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';
import darkModePreview from '@/assets/dark-mode-preview.png';

defineOptions({
  name: 'ModalDarkModeIntro',
});

interface Props {
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const model = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const { setTheme } = useTheme();

const THEME_STORAGE_KEY = 'unnnic-theme';

const t = (key: string): string => i18n.global.t(key) as string;

function applyDark() {
  setTheme('dark');
  if (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(THEME_STORAGE_KEY) !== 'dark'
  ) {
    throw new Error('theme persistence failed');
  }
}

function switchToDark() {
  try {
    applyDark();
    model.value = false;
    unnnicToastManager.success(
      t('dark_mode_intro.toast.success.title'),
      undefined,
      {
        button: {
          text: t('dark_mode_intro.toast.success.action'),
          action: () => setTheme('light'),
        },
      },
    );
  } catch {
    unnnicToastManager.error(
      t('dark_mode_intro.toast.error.title'),
      undefined,
      {
        button: {
          text: t('dark_mode_intro.toast.error.action'),
          action: switchToDark,
        },
      },
    );
  }
}

function dismiss() {
  model.value = false;
}
</script>

<style lang="scss" scoped>
.dark-mode-intro {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-6;
  }

  &__paragraph,
  &__tagline {
    margin: 0;

    color: $unnnic-color-fg-base;
    font: $unnnic-font-body;
  }

  &__preview {
    display: block;
    width: 100%;
    max-width: 564px;
    height: auto;
    margin: 0 auto;
  }
}
.dark-mode-intro__content.unnnic-dialog-content .unnnic-dialog-footer {
  justify-content: flex-end;

  > * {
    width: auto;
  }
}
</style>
