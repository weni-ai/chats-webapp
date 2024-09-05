<template>
  <section class="sector-extra-options-form">
    <section class="switchs">
      <h2 class="switchs__title">
        {{ $t('sector.additional_options.title') }}
      </h2>
      <UnnnicSwitch
        v-model="sector.can_trigger_flows"
        :textRight="
          sector.can_trigger_flows
            ? $t('sector.additional_options.template_message.switch_active')
            : $t('sector.additional_options.template_message.switch_disabled')
        "
      />
      <section class="switchs__container">
        <UnnnicSwitch
          v-model="sector.sign_messages"
          :textRight="
            sector.sign_messages
              ? $t('sector.additional_options.agents_signature.switch_active')
              : $t('sector.additional_options.agents_signature.switch_disabled')
          "
        />
        <UnnnicToolTip
          enabled
          :text="$t('sector.additional_options.agents_signature.tooltip')"
          side="right"
          maxWidth="15rem"
        >
          <UnnnicIconSvg
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </section>
      <UnnnicSwitch
        v-model="sector.can_edit_custom_fields"
        :textRight="$t('sector.additional_options.edit_custom_fields')"
      />
    </section>
    <section class="tags">
      <h2 class="tags__title">
        {{ $t('tags.add.title') }}
        <UnnnicToolTip
          enabled
          side="right"
          :text="$t('new_sector.tags_tip')"
          maxWidth="23rem"
        >
          <UnnnicIconSvg
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </h2>

      <section class="tags-form">
        <UnnnicInput
          v-model="tagName"
          class="tags-form__input"
          :label="$t('tags.add.label')"
          :placeholder="$t('tags.add.placeholder')"
          @keypress.enter.stop="addTag(tagName)"
        />
        <UnnnicButton
          type="secondary"
          :text="$t('add')"
          :disabled="!tagName.trim()"
          @click="addTag(tagName)"
        />
      </section>

      <section
        v-if="tags.length > 0"
        class="form-tags__section"
      >
        <TagGroup
          :tags="tags"
          selectable
          hasCloseIcon
          @close="removeTag($event)"
        />
      </section>
    </section>
  </section>
</template>

<script>
export default {
  name: 'SectorExtraOptionsForm',
};
</script>

<script setup>
import TagGroup from '@/components/TagGroup.vue';
import unnnic from '@weni/unnnic-system';
import { onMounted, reactive, ref } from 'vue';

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
});

const sector = defineModel({ type: [Object] });
const tagName = ref('');
const toAddTags = reactive([]);
const tags = reactive([]);

onMounted(() => {
  const { isEditing } = props;
  console.log(isEditing);
});

const addTag = (tagNameToAdd) => {
  const tagsName = tags.map((tag) => tag.name);

  if (tagsName.includes(tagNameToAdd)) {
    unnnic.unnnicCallAlert({
      props: { text: 'Já existe uma tag com esse nome', type: 'warning' },
    });
    return;
  }
  const tag = {
    name: tagNameToAdd,
    uuid: Date.now().toString(),
  };
  toAddTags.push(tag);
  tags.push(tag);
  tagName.value = '';
};
</script>

<style lang="scss" scoped>
.sector-extra-options-form {
  & .switchs {
    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-line-height-large * 1.5;
      margin-bottom: $unnnic-spacing-ant;
    }

    &__container {
      display: flex;
      align-items: center;

      .unnnic-tooltip {
        display: flex;
      }
    }
  }

  & .tags {
    margin-top: $unnnic-spacing-sm;
    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-line-height-large * 1.5;
      margin-bottom: $unnnic-spacing-ant;
    }
    &-form {
      display: flex;
      align-items: flex-end;
      gap: $unnnic-spacing-stack-sm;
      &__input {
        flex: 1 1;
      }
    }
  }
}
</style>
