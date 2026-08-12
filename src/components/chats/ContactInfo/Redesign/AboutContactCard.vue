<template>
  <section
    class="about-contact-card"
    data-testid="about-contact-card"
  >
    <header class="about-contact-card__header">
      <h3 class="about-contact-card__title">
        {{ $t('contact_info.title') }}
      </h3>

      <section
        v-if="isLinkedToOtherAgent"
        class="about-contact-card__linked-contact"
      >
        <UnnnicIcon
          icon="info"
          size="ant"
          scheme="fg-warning"
        />
        <p>
          {{
            $t('contact_info.linked_contact', {
              name: linkedUserName,
            })
          }}
        </p>
      </section>

      <section
        v-else-if="showLinkSwitch"
        class="about-contact-card__sync-contact"
      >
        <UnnnicSwitch
          :modelValue="isLinkedUser"
          size="small"
          :textRight="
            isLinkedUser
              ? $t('contact_info.switch_disassociate_contact')
              : $t('contact_info.switch_associate_contact')
          "
          @update:model-value="emit('update:isLinkedUser', $event)"
        />
        <UnnnicToolTip
          enabled
          :text="$t('contact_info.switch_tooltip')"
          side="left"
        >
          <UnnnicIconSvg
            icon="info"
            scheme="fg-base"
            size="sm"
          />
        </UnnnicToolTip>
      </section>
    </header>

    <section class="about-contact-card__content">
      <p
        v-if="isOnline"
        class="about-contact-card__status"
      >
        {{ $t('status.online') }}
      </p>
      <p
        v-if="lastMessageText"
        class="about-contact-card__last-message"
      >
        {{ lastMessageText }}
      </p>

      <section class="about-contact-card__item">
        <section class="about-contact-card__item-content">
          <p class="about-contact-card__item-title">{{ $t('name') }}:</p>
          <p class="about-contact-card__item-value">
            {{ contactName }}
          </p>
        </section>
        <CopyValueButton :value="contactName" />
      </section>

      <section class="about-contact-card__item">
        <section class="about-contact-card__item-content">
          <p class="about-contact-card__item-title">
            {{ contactPlatform || $t('URN') }}:
          </p>
          <p class="about-contact-card__item-value">
            {{ contactNumber }}
          </p>
        </section>
        <CopyValueButton :value="contactNumber" />
      </section>

      <Transition name="expand-with-fade">
        <section
          v-if="hasCustomFields && openCustomFields"
          class="about-contact-card__custom-fields"
        >
          <CustomField
            v-for="(value, key) in customFields"
            :key="key"
            :title="key"
            :description="value"
            :isEditable="canEditCustomFields"
            :isCurrent="isCurrentCustomField(key)"
            :value="currentCustomField?.[key]"
            @update-current-custom-field="
              emit('update-current-custom-field', $event)
            "
            @save-value="emit('save-value')"
          />
        </section>
      </Transition>

      <section
        v-if="hasCustomFields"
        class="about-contact-card__slide"
      >
        <UnnnicIcon
          :icon="openCustomFields ? 'expand_less' : 'expand_more'"
          clickable
          @click="emit('update:openCustomFields', !openCustomFields)"
        />
      </section>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CustomField from '../CustomField.vue';
import CopyValueButton from '../CopyValueButton.vue';

defineOptions({
  name: 'AboutContactCard',
});

type CustomFields = Record<string, string>;

const props = withDefaults(
  defineProps<{
    contactName?: string;
    contactNumber?: string;
    contactPlatform?: string;
    isOnline?: boolean;
    lastMessageText?: string;
    customFields?: CustomFields;
    currentCustomField?: CustomFields;
    canEditCustomFields?: boolean;
    openCustomFields?: boolean;
    isLinkedUser?: boolean;
    isLinkedToOtherAgent?: boolean;
    linkedUserName?: string;
    showLinkSwitch?: boolean;
  }>(),
  {
    contactName: '',
    contactNumber: '',
    contactPlatform: '',
    isOnline: false,
    lastMessageText: '',
    customFields: () => ({}),
    currentCustomField: () => ({}),
    canEditCustomFields: false,
    openCustomFields: true,
    isLinkedUser: false,
    isLinkedToOtherAgent: false,
    linkedUserName: '',
    showLinkSwitch: false,
  },
);

const emit = defineEmits<{
  'update:isLinkedUser': [value: boolean];
  'update:openCustomFields': [value: boolean];
  'update-current-custom-field': [customField: CustomFields];
  'save-value': [];
}>();

const hasCustomFields = computed(
  () => Object.keys(props.customFields || {}).length > 0,
);

const isCurrentCustomField = (key: string): boolean => {
  const currentKey = Object.keys(props.currentCustomField || {})?.[0];
  return currentKey === key;
};
</script>

<style lang="scss" scoped>
@import '@/styles/animations';

.about-contact-card {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  padding: $unnnic-space-4;
  background-color: $unnnic-color-bg-base;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $unnnic-space-2;
  }

  &__title {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }

  &__linked-contact {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-warning;
  }

  &__sync-contact {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    flex-shrink: 0;

    :deep(.unnnic-tooltip) {
      display: flex;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
  }

  &__status,
  &__item-value {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }

  &__last-message {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;

    &-content {
      display: flex;
      align-items: center;
      gap: $unnnic-space-1;
    }

    &-title {
      font: $unnnic-font-emphasis;
      color: $unnnic-color-fg-base;
    }
  }

  &__custom-fields {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
  }

  &__slide {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
