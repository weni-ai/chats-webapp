<template>
  <section class="sector-extra-options-form">
    <section class="switchs">
      <h2
        class="switchs__title"
        data-testid="switchs-title"
      >
        {{ $t('sector.additional_options.title') }}
      </h2>
      <UnnnicSwitch
        v-model="sector.can_trigger_flows"
        :textRight="translationTriggerFlows"
        size="small"
        data-testid="config-switch"
      />
      <section class="switchs__container">
        <UnnnicSwitch
          v-model="sector.sign_messages"
          size="small"
          :textRight="translationSignMessages"
          data-testid="config-switch"
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
        data-testid="config-switch"
        size="small"
      />
      <template
        v-if="
          featureFlags.active_features?.includes('weniChatsAutomaticMessage')
        "
      >
        <section class="switchs__container">
          <UnnnicSwitch
            :modelValue="sector.automatic_message.is_active"
            :textRight="
              sector.automatic_message.is_active
                ? $t(
                    'sector.additional_options.automatic_message.switch_active',
                  )
                : $t(
                    'sector.additional_options.automatic_message.switch_disabled',
                  )
            "
            size="small"
            data-testid="config-switch"
            @update:model-value="handleAutomaticMessageIsActive"
          />
          <UnnnicToolTip
            enabled
            :text="$t('sector.additional_options.automatic_message.tooltip')"
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
        <fieldset v-if="sector.automatic_message.is_active">
          <UnnnicInputNext
            v-model="sector.automatic_message.text"
            :maxlength="160"
            :label="
              $t('sector.additional_options.automatic_message.field.title')
            "
            :placeholder="
              $t(
                'sector.additional_options.automatic_message.field.placeholder',
              )
            "
          />
          <p class="automatic-message-count">
            {{ sector.automatic_message?.text?.length || 0 }}/160
          </p>
        </fieldset>
      </template>
      <section class="switchs__container">
        <UnnnicSwitch
          v-model="sector.is_csat_enabled"
          :textRight="
            sector.is_csat_enabled
              ? $t('sector.additional_options.csat.enabled')
              : $t('sector.additional_options.csat.disabeld')
          "
          size="small"
        />
        <UnnnicToolTip
          enabled
          :text="$t('sector.additional_options.csat.tooltip')"
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
    </section>
    <section class="tags">
      <h2
        class="tags__title"
        data-testid="tags-title"
      >
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
        <UnnnicInputNext
          v-model="tagName"
          class="tags-form__input"
          :label="$t('tags.add.label')"
          :placeholder="$t('tags.add.placeholder')"
          data-testid="tags-input-tag-name"
          @keypress.enter.stop="!!tagName.trim() && addTag(tagName)"
        />
        <UnnnicButton
          type="secondary"
          :text="$t('add')"
          :disabled="!tagName.trim()"
          data-testid="tags-add-tag-button"
          @click="addTag(tagName)"
        />
      </section>

      <section
        v-if="tags.length > 0"
        class="form-tags__section"
        data-testid="tags-group-section"
      >
        <TagGroup
          v-model="tags"
          :tags="tags"
          data-testid="sector-tag-group"
          disabledTag
          @close="removeTag($event)"
        />
      </section>
    </section>
    <section
      v-show="isEditing"
      class="form-actions"
    >
      <UnnnicButton
        :text="$t('cancel')"
        type="tertiary"
        data-testid="cancel-button"
        @click.stop="$router.push('/settings')"
      />
      <UnnnicButton
        :text="$t('save')"
        :disabled="!validForm"
        @click.stop="save()"
      />
    </section>
  </section>
</template>

<script>
import unnnic from '@weni/unnnic-system';

import TagGroup from '@/components/TagGroup.vue';

import Sector from '@/services/api/resources/settings/sector';

import { mapState } from 'pinia';
import { useFeatureFlag } from '@/store/modules/featureFlag';

export default {
  name: 'SectorExtraOptionsForm',
  components: {
    TagGroup,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'changeIsValid'],
  data() {
    return {
      tagName: '',
      currentTags: [],
      toAddTags: [],
      tags: [],
      isLoading: false,
    };
  },
  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    sector: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit('update:modelValue', val);
      },
    },
    validForm() {
      const valid =
        !this.sector.automatic_message.is_active ||
        (this.sector.automatic_message.is_active &&
          this.sector.automatic_message.text?.length > 0);

      this.$emit('changeIsValid', valid);

      return valid;
    },
    translationTriggerFlows() {
      return this.sector.can_trigger_flows
        ? this.$t('sector.additional_options.template_message.switch_active')
        : this.$t('sector.additional_options.template_message.switch_disabled');
    },
    translationSignMessages() {
      return this.sector.sign_messages
        ? this.$t('sector.additional_options.agents_signature.switch_active')
        : this.$t('sector.additional_options.agents_signature.switch_disabled');
    },
  },
  mounted() {
    if (this.isEditing) this.getTags();
  },
  methods: {
    handleAutomaticMessageIsActive(value) {
      this.sector.automatic_message.is_active = value;
      if (!value) this.sector.automatic_message.text = '';
    },
    async getTags() {
      const sectorCurrentTags = await Sector.tags(this.sector.uuid);
      this.currentTags = this.tags = sectorCurrentTags.results;
    },
    async addTag(tagNameToAdd) {
      const tagsName = this.tags.map((tag) => tag.name);

      if (tagsName.includes(tagNameToAdd)) {
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.edit_sector.tag_already_exists'),
            type: 'error',
          },
        });
        return;
      }

      let tag = {
        name: tagNameToAdd,
        uuid: Date.now().toString(),
      };

      if (this.isEditing) {
        tag = await Sector.addTag(this.sector.uuid, tagNameToAdd);
      } else {
        this.toAddTags.push(tag);
      }

      this.tags.push(tag);
      this.tagName = '';
    },
    async removeTag(tag) {
      if (this.isEditing) await Sector.removeTag(tag.uuid);
      else {
        this.toAddTags = this.toAddTags.filter(
          (toAddTag) => toAddTag.uuid !== tag.uuid,
        );
      }

      this.tags = this.tags.filter((addedTag) => addedTag.uuid !== tag.uuid);
    },
    updateSectorExtraConfigs() {
      const {
        can_trigger_flows,
        can_edit_custom_fields,
        sign_messages,
        automatic_message,
        is_csat_enabled,
      } = this.sector;

      const fieldsToUpdate = {
        can_trigger_flows,
        can_edit_custom_fields,
        sign_messages,
        automatic_message,
        is_csat_enabled,
      };

      return Sector.update(this.sector.uuid, fieldsToUpdate);
    },
    updateSectorTags() {
      const addPromises = this.toAddTags.map(({ name }) =>
        Sector.addTag(this.sector.uuid, name),
      );

      return Promise.all([...addPromises]);
    },
    async save(silent = false) {
      this.isLoading = true;
      try {
        await Promise.all([
          this.updateSectorTags(),
          this.updateSectorExtraConfigs(),
        ]).then(() => {
          if (!silent)
            unnnic.unnnicCallAlert({
              props: {
                text: this.$t('sector_update_success'),
                type: 'success',
              },
              seconds: 5,
            });

          this.$router.push('/settings');
        });
      } catch (error) {
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_update_error'),
            type: 'error',
          },
          seconds: 5,
        });
      }
      this.isLoading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.form-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  background-color: white;
  padding: $unnnic-spacing-sm;

  gap: $unnnic-spacing-sm;

  > * {
    flex: 1;
  }
}
.sector-extra-options-form {
  .automatic-message-count {
    font: $unnnic-font-caption-2;
    justify-self: flex-end;
    margin-top: $unnnic-spacing-nano;
    color: $unnnic-color-fg-muted;
  }

  & .switchs {
    display: grid;
    gap: $unnnic-space-2;
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
    :deep(.unnnic-brand-tag) {
      color: $unnnic-color-weni-700;
      background-color: white;
      svg > path {
        fill: $unnnic-color-weni-700;
      }
    }

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

        :deep(.unnnic-form__label) {
          margin: 0px 0px $unnnic-spacing-xs 0px;
        }
      }
    }
  }
}
</style>
