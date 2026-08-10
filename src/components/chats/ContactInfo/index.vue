<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="contact-info__container">
    <ContactInfosLoading v-show="isLoading" />
    <AsideSlotTemplate
      v-show="!isLoading"
      v-if="closedRoom || room"
      class="contact-info"
    >
      <template #header>
        <header class="contact-info__header">
          <p>{{ $t('chats.room_contact_info.title') }}</p>
          <div>
            <UnnnicButton
              v-if="!isHistory"
              iconCenter="sync"
              type="tertiary"
              size="small"
              :disabled="isRefreshContactDisabled"
              @click="refreshContactInfos"
            />
            <UnnnicButton
              v-if="!isHistory"
              iconCenter="close"
              type="tertiary"
              size="small"
              @click="emitClose"
            />
          </div>
        </header>
      </template>
      <section class="scrollable">
        <AsideSlotTemplateSection class="contact-info__section">
          <section class="infos-header">
            <section class="infos-header__title-container">
              <h3 class="infos-header__title">
                {{ $t('contact_info.title') }}
              </h3>
              <section
                v-if="isLinkedToOtherAgent"
                class="infos-header__linked-contact"
              >
                <UnnnicIcon
                  icon="info"
                  size="ant"
                  scheme="fg-warning"
                />
                <p>
                  {{
                    $t('contact_info.linked_contact', {
                      name: room.linked_user,
                    })
                  }}
                </p>
              </section>
            </section>
            <div
              v-if="!isLinkedToOtherAgent && !isViewMode && !isHistory"
              class="sync-contact"
            >
              <UnnnicSwitch
                v-model="isLinkedUser"
                size="small"
                :textRight="
                  isLinkedUser
                    ? $t('contact_info.switch_disassociate_contact')
                    : $t('contact_info.switch_associate_contact')
                "
                @update:model-value="addContactToAgent"
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
            </div>
          </section>
          <section class="infos-contact">
            <p
              v-if="room?.contact.status === 'online'"
              class="infos-contact__item-value"
            >
              {{ $t('status.online') }}
            </p>
            <p
              v-if="lastMessageFromContact?.created_on"
              class="infos-contact__item-last-contact"
            >
              {{
                $t('last_message_time.date', {
                  date: moment(lastMessageFromContact?.created_on).fromNow(),
                })
              }}
            </p>
            <section class="infos-contact__item">
              <section class="infos-contact__item-content">
                <p class="infos-contact__item-title">{{ $t('name') }}:</p>
                <p class="infos-contact__item-value">
                  {{ (closedRoom || room).contact.name }}
                </p>
              </section>
              <CopyValueButton :value="(closedRoom || room).contact.name" />
            </section>
            <section class="infos-contact__item">
              <section class="infos-contact__item-content">
                <p class="infos-contact__item-title">
                  {{ contactNumber?.plataform || $t('URN') }}:
                </p>
                <p class="infos-contact__item-value">
                  {{ contactNumber?.contactNum }}
                </p>
              </section>
              <CopyValueButton :value="contactNumber?.contactNum" />
            </section>

            <Transition name="expand-with-fade">
              <section
                v-if="hasCustomFields && openCustomFields"
                class="custom-fields-container"
              >
                <CustomField
                  v-for="(value, key) in computedCustomFields"
                  :key="key"
                  :title="key"
                  :description="value"
                  :isEditable="!isHistory && room.can_edit_custom_fields"
                  :isCurrent="isCurrentCustomField(key)"
                  :value="currentCustomField?.[key]"
                  @update-current-custom-field="updateCurrentCustomField"
                  @save-value="saveCurrentCustomFieldValue"
                />
              </section>
            </Transition>

            <section
              v-if="hasCustomFields"
              class="infos-contact__slide"
            >
              <UnnnicIcon
                :icon="openCustomFields ? 'expand_less' : 'expand_more'"
                clickable
                @click="openCustomFields = !openCustomFields"
              />
            </section>
          </section>
        </AsideSlotTemplateSection>

        <AboutSupport
          :closedRoom="closedRoom"
          :isHistory="isHistory"
          :isViewMode="isViewMode"
        />

        <AsideSlotTemplateSection class="contact-info__section">
          <ContactMedia
            :room="room"
            :history="isHistory"
            :contactInfo="(closedRoom || room).contact"
            @fullscreen="openFullScreen"
            @loaded-medias="isLoading = false"
          />
        </AsideSlotTemplateSection>
      </section>

      <FullscreenPreview
        v-if="isFullscreen && currentMedia"
        :downloadMediaUrl="currentMedia?.url"
        :downloadMediaName="currentMedia?.message"
        :mediaCurrent="currentMediaIndex"
        :mediaTotal="images.length"
        @close="isFullscreen = false"
        @next="nextMedia"
        @previous="previousMedia"
      >
        <VideoPreview
          v-if="currentMedia.content_type.includes('mp4')"
          :src="currentMedia.url"
          @keypress.enter="() => {}"
          @click.stop="() => {}"
        />
        <img
          v-else
          :src="currentMedia.url"
          :alt="currentMedia.url"
          @keypress.enter="() => {}"
          @click.stop="() => {}"
        />
      </FullscreenPreview>
    </AsideSlotTemplate>
  </div>
</template>

<script>
import isMobile from 'is-mobile';

import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

import ContactInfosLoading from '@/views/loadings/ContactInfos.vue';

import Room from '@/services/api/resources/chats/room';
import LinkContact from '@/services/api/resources/chats/linkContact';

import unnnic from '@weni/unnnic-system';

import CustomField from './CustomField.vue';
import CopyValueButton from './CopyValueButton.vue';
import ContactMedia from './Media.vue';
import VideoPreview from '../MediaMessage/Previews/Video.vue';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';
import AboutSupport from './AboutSupport.vue';

import moment from 'moment';
import { parseUrn } from '@/utils/room';

import i18n from '@/plugins/i18n';

export default {
  name: 'ContactInfo',

  components: {
    ContactInfosLoading,
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    CustomField,
    CopyValueButton,
    ContactMedia,
    FullscreenPreview,
    VideoPreview,
    AboutSupport,
  },
  props: {
    closedRoom: {
      type: Object,
      default: () => {},
    },
    isHistory: {
      type: Boolean,
      default: false,
    },
    isViewMode: {
      type: Boolean,
      default: false,
    },
    showRoomSummary: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['transferred-contact', 'close'],

  data: () => ({
    isLoading: true,
    transferContactError: '',
    showSuccessfulTransferModal: false,
    showTransferProgressBar: false,
    isLinkedUser: false,
    isLinkedToOtherAgent: false,
    isFullscreen: false,
    currentMedia: {},
    images: [],
    contactHaveHistory: false,
    customFields: {},
    currentCustomField: {},
    isRefreshContactDisabled: false,
    openCustomFields: true,
  }),

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      activeRoomSummary: 'activeRoomSummary',
      isLoadingActiveRoomSummary: 'isLoadingActiveRoomSummary',
    }),

    hasCustomFields() {
      return Object.keys(this.computedCustomFields).length > 0;
    },

    computedCustomFields() {
      const customFields = { ...(this.customFields || {}) };
      const roomService = this.contactService;
      if (roomService?.length > 0) {
        customFields[this.$t('service')] = roomService;
      }
      return customFields;
    },

    currentMediaIndex() {
      if (!this.currentMedia?.url) {
        return 0;
      }

      return (
        this.images.findIndex((el) => el.url === this.currentMedia.url) + 1
      );
    },
    isMobile() {
      return isMobile();
    },

    headerMobileSubtitle() {
      return this.isMobile ? this.room?.contact?.name : '';
    },
    headerMobileBack() {
      return this.isMobile ? () => this.emitClose() : undefined;
    },
    headerDesktopIcon() {
      return !this.isMobile ? 'info' : '';
    },

    lastMessageFromContact() {
      const messages = useRoomMessages().roomMessages;
      if (messages) {
        return messages.findLast((message) => message.contact);
      }
      return '';
    },

    contactNumber() {
      const room = this.closedRoom || this.room;

      return parseUrn(room);
    },
    contactService() {
      return (this.closedRoom || this.room).service_chat;
    },
  },

  watch: {
    'room.uuid': {
      immediate: true,
      handler(newRoom) {
        if (newRoom) {
          this.customFields = { ...(this.room.custom_fields || {}) };
          this.loadRoomTags();
        }
      },
    },
    'room.custom_fields': {
      handler(newCustomFields) {
        if (newCustomFields) {
          this.customFields = { ...newCustomFields };
        }
      },
    },
    '$i18n.locale': {
      immediate: true,
      handler(locale) {
        moment.locale(locale || 'en');
      },
    },
  },

  async created() {
    const { closedRoom, room } = this;
    const sourceRoom =
      closedRoom && Object.keys(closedRoom).length > 0 ? closedRoom : room;

    this.customFields = { ...(sourceRoom?.custom_fields || {}) };

    if (this.isHistory) {
      return;
    }

    if (
      moment(sourceRoom.contact.created_on).format('YYYY-MM-DD') <
      moment().format('YYYY-MM-DD')
    ) {
      this.contactHaveHistory = true;
    }

    this.loadLinkedContact();

    if (!room.queue?.sector) {
      throw new Error(`There is no associated sector with room ${room.uuid}`);
    }
  },

  methods: {
    moment,
    ...mapActions(useRooms, ['updateRoomContact']),
    emitClose() {
      this.$emit('close');
    },

    getCurrentCustomFieldKey() {
      return Object.keys(this.currentCustomField)?.[0];
    },

    isCurrentCustomField(key) {
      if (!this.currentCustomField) return false;
      return this.getCurrentCustomFieldKey() === key;
    },

    updateCurrentCustomField({ key, value }) {
      this.currentCustomField = key ? { [key]: value } : {};
    },

    saveCurrentCustomFieldValue() {
      const currentCustomFieldKey = this.getCurrentCustomFieldKey();
      const currentCustomFieldValue =
        this.currentCustomField[currentCustomFieldKey];

      if (currentCustomFieldValue) {
        if (
          currentCustomFieldValue !== this.customFields?.[currentCustomFieldKey]
        ) {
          Room.updateCustomFields(this.room.uuid, this.currentCustomField);
        }

        this.customFields = {
          ...(this.customFields || {}),
          [currentCustomFieldKey]: currentCustomFieldValue,
        };

        if (this.room) {
          this.room.custom_fields = {
            ...(this.room.custom_fields || {}),
            [currentCustomFieldKey]: currentCustomFieldValue,
          };
        }
      }

      this.updateCurrentCustomField({});
    },

    openFullScreen(url, images) {
      this.images = images;
      this.currentMedia = this.images.find((el) => el.url === url);
      this.isFullscreen = true;
    },

    nextMedia() {
      const imageIndex = this.images.findIndex(
        (el) => el.url === this.currentMedia.url,
      );
      if (imageIndex + 1 < this.images.length) {
        this.currentMedia = this.images[imageIndex + 1];
      }
    },

    previousMedia() {
      const imageIndex = this.images.findIndex(
        (el) => el.url === this.currentMedia.url,
      );
      if (imageIndex - 1 >= 0) {
        this.currentMedia = this.images[imageIndex - 1];
      }
    },

    addContactToAgent() {
      if (this.isLinkedUser) {
        this.linkContact();
      } else {
        this.removeLinkedContact();
      }
    },

    verifyLinkedUser() {
      const nameUser = `${this.room.user.first_name} ${this.room.user.last_name}`;
      if (nameUser === this.room.linked_user || this.room.linked_user === '') {
        this.isLinkedToOtherAgent = false;
      } else {
        this.isLinkedToOtherAgent = true;
      }
    },

    async loadLinkedContact() {
      const contact = this.room.contact.uuid;
      try {
        const response = await LinkContact.getLinketContact({ contact });
        if (response.Detail) {
          this.isLinkedUser = false;
        } else {
          this.isLinkedUser = true;
          this.verifyLinkedUser();
        }
      } catch (error) {
        console.log(error);
      }
    },
    async linkContact() {
      const contact = this.room.contact.uuid;
      try {
        await LinkContact.linkContactToAgent({ contact });
        this.showAlert(this.$t('contact_info.alert_linked'));
        this.verifyLinkedUser();
      } catch (error) {
        console.log(error);
      }
    },

    async removeLinkedContact() {
      const contact = this.room.contact.uuid;
      try {
        await LinkContact.removeContactFromAgent(contact);
        this.showAlert(this.$t('contact_info.alert_detached'));
        this.verifyLinkedUser();
      } catch (error) {
        console.log(error);
      }
    },

    async refreshContactInfos() {
      if (this.isRefreshContactDisabled) return;

      this.isRefreshContactDisabled = true;
      const timeToCanRefreshAgain = 5000;

      setTimeout(() => {
        this.isRefreshContactDisabled = false;
      }, timeToCanRefreshAgain);

      const { uuid } = this.room;

      try {
        await this.updateRoomContact({ uuid });
        this.showAlert(i18n.global.t('updated_info'));
      } catch (error) {
        console.error('Erro ao atualizar as informações do contato.', error);
      }
    },

    showAlert(text, type = 'success') {
      unnnic.unnnicCallAlert({
        props: {
          text,
          type,
          size: 'small',
        },
        seconds: 5,
      });
    },

    navigate(name) {
      this.$router.replace({ name });
    },
    getLastTimeOnlineText(lastView) {
      const today = new Date();
      const lastViewDate = new Date(lastView);
      const dateDifferenceInHours = this.getDatesDifferenceInHours(
        today,
        lastViewDate,
      );

      if (dateDifferenceInHours >= 24) {
        const formattedDate = Intl.DateTimeFormat(this.$i18n.locale, {
          dateStyle: 'short',
        }).format(lastViewDate);

        const formattedTime = Intl.DateTimeFormat(this.$i18n.locale, {
          timeStyle: 'short',
        })
          .format(lastViewDate)
          .replace(':', 'h');

        return this.$t('last_online_time.date', {
          date: formattedDate,
          time: formattedTime,
        });
      }

      const dateDifferenceInMinutes = dateDifferenceInHours * 60;
      return dateDifferenceInMinutes > 60
        ? this.$t('last_online_time.hours', {
            hours: Number.parseInt(dateDifferenceInHours, 10),
          })
        : this.$t('last_online_time.minutes', {
            minutes: Number.parseInt(dateDifferenceInMinutes, 10),
          });
    },
    getDatesDifferenceInHours(a, b) {
      const differenceInMs = Math.abs(a - b);
      const oneHoursInMs = 60 * 60 * 1000;
      const differenceInHours = differenceInMs / oneHoursInMs;
      return differenceInHours;
    },
    lowercase(value) {
      return value.toString().toLowerCase();
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/animations';

.contact-info__container {
  height: 100%;

  overflow: hidden;

  background-color: $unnnic-color-bg-base;
}

.contact-info {
  &__section {
    padding: $unnnic-space-2;
  }
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $unnnic-space-2;
    min-height: var(--chats-column-header-height, 57px);
    font: $unnnic-font-display-4;
    color: $unnnic-color-fg-emphasized;
    border-bottom: 1px solid $unnnic-color-border-soft;
  }

  .scrollable {
    overflow: hidden auto;
    height: 100%;
  }

  .aside-slot-template-section {
    width: 100%;

    background-color: $unnnic-color-bg-base;
  }

  .infos {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &__title {
        font: $unnnic-font-display-4;
        color: $unnnic-color-fg-emphasized;
      }

      &__linked-contact {
        display: flex;
        align-items: center;
        gap: $unnnic-space-1;
        font: $unnnic-font-emphasis;
        color: $unnnic-color-fg-warning;
      }

      .sync-contact {
        margin-left: -$unnnic-spacing-xs;

        display: flex;
        align-items: center;
        gap: $unnnic-space-1;

        :deep(.unnnic-tooltip) {
          display: flex;
        }
      }
    }

    &-contact {
      display: flex;
      flex-direction: column;
      padding-top: $unnnic-space-2;
      gap: $unnnic-space-1;

      &__item {
        display: flex;
        align-items: baseline;
        gap: $unnnic-space-2;
        &-content {
          display: flex;
          align-items: center;
          gap: $unnnic-space-1;
        }

        &-title {
          font: $unnnic-font-emphasis;
          color: $unnnic-color-fg-base;
          font-weight: $unnnic-font-weight-bold;
        }

        &-last-contact {
          font: $unnnic-font-caption-2;
          color: $unnnic-color-fg-base;
        }

        &-value {
          font: $unnnic-font-body;
          color: $unnnic-color-fg-base;
        }
      }

      &__slide {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
}

.custom-fields-container {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-1;
}
</style>
