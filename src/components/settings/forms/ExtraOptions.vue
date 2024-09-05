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
          @keypress.enter.stop="!!tagName.trim() && addTag(tagName)"
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

    <section
      v-if="isEditing"
      class="actions"
    >
      <UnnnicButton
        :text="$t('cancel')"
        type="tertiary"
        :disabled="isLoading"
        @click.stop="$router.push('/settings')"
      />
      <UnnnicButton
        :text="$t('save')"
        :disabled="!validForm"
        :loading="isLoading"
        data-testid="save-button"
        @click.stop="save()"
      />
    </section>
  </section>
</template>

<script>
export default {
  name: 'SectorExtraOptionsForm',
};
</script>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import unnnic from '@weni/unnnic-system';

import TagGroup from '@/components/TagGroup.vue';

import Sector from '@/services/api/resources/settings/sector';

import i18n from '@/plugins/i18n';

const router = useRouter();

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
});

const sector = defineModel({ type: [Object] });
const tagName = ref('');

let currentTags = [];

const toAddTags = ref([]);
let toRemoveTags = reactive([]);
const tags = ref([]);
const isLoading = ref(false);

onMounted(() => {
  const { isEditing } = props;
  if (isEditing) {
    getTags();
  }
});

const validForm = computed(() => {
  return !!tags.value.length;
});

const getTags = async () => {
  const sectorCurrentTags = await Sector.tags(sector.value.uuid);
  currentTags = tags.value = sectorCurrentTags.results;
};

const addTag = (tagNameToAdd) => {
  const tagsName = tags.value.map((tag) => tag.name);

  if (tagsName.includes(tagNameToAdd)) {
    unnnic.unnnicCallAlert({
      props: { text: 'Já existe uma tag com esse nome', type: 'error' },
    });
    return;
  }
  const tag = {
    name: tagNameToAdd,
    uuid: Date.now().toString(),
  };
  toAddTags.value.push(tag);
  tags.value.push(tag);
  tagName.value = '';
};

const removeTag = (tag) => {
  toRemoveTags.push(tag);
  toAddTags.value = toAddTags.value.filter(
    (toAddTag) => toAddTag.uuid !== tag.uuid,
  );
  tags.value = tags.value.filter((addedTag) => addedTag.uuid !== tag.uuid);
};

const updateSectorExtraConfigs = () => {
  const { can_trigger_flows, can_edit_custom_fields, sign_messages } =
    sector.value;

  const fieldsToUpdate = {
    can_trigger_flows,
    can_edit_custom_fields,
    sign_messages,
  };

  return Sector.update(sector.value.uuid, fieldsToUpdate);
};

const updateSectorTags = () => {
  const currentTagsUuid = currentTags.map((tag) => tag.uuid);

  const checkedToRemoveTags = toRemoveTags.filter((tag) =>
    currentTagsUuid.includes(tag.uuid),
  );

  console.log(checkedToRemoveTags);

  const removePromises = checkedToRemoveTags.map(({ uuid }) =>
    Sector.removeTag(uuid),
  );

  const addPromises = toAddTags.value.map(({ name }) =>
    Sector.addTag(sector.value.uuid, name),
  );

  return Promise.all([...addPromises, ...removePromises]);
};

const save = async () => {
  isLoading.value = true;
  Promise.all([await updateSectorTags(), await updateSectorExtraConfigs()])
    .then(() => {
      unnnic.unnnicCallAlert({
        props: {
          text: i18n.global.t('sector_update_success'),
          type: 'success',
        },
        seconds: 5,
      });

      router.push('/settings');
    })
    .catch(() => {
      unnnic.unnnicCallAlert({
        props: {
          text: i18n.global.t('sector_update_error'),
          type: 'error',
        },
        seconds: 5,
      });
    })
    .finally(() => {
      isLoading.value = false;
    });
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

  & .actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    background-color: white;
    padding-top: $unnnic-spacing-md;

    gap: $unnnic-spacing-sm;

    > * {
      flex: 1;
    }
  }
}
</style>
