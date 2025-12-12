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
                  scheme="neutral-cloudy"
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
              <p class="infos-contact__item-title">{{ $t('name') }}:</p>
              <p class="infos-contact__item-value">
                {{ (closedRoom || room).contact.name }}
              </p>
            </section>
            <section class="infos-contact__item">
              <p class="infos-contact__item-title">
                {{ contactNumber?.plataform || $t('URN') }}:
              </p>
              <p class="infos-contact__item-value">
                {{ contactNumber?.contactNum }}
              </p>
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
        <AsideSlotTemplateSection class="contact-info__section">
          <section class="contact-info__about-support">
            <header class="contact-info__about-support-header">
              <h3 class="contact-info__about-support-title">
                {{ $t('contact_info.about_support') }}
              </h3>
              <section class="contact-info__about-support-header__buttons">
                <UnnnicDropdown
                  v-if="
                    !isHistory && !isViewMode && allTags.length > 0 && room.user
                  "
                  :open="openDropdownTags"
                  useOpenProp
                >
                  <template #trigger>
                    <UnnnicButton
                      iconLeft="add-1"
                      type="secondary"
                      size="small"
                      @click="openDropdownTags = !openDropdownTags"
                    >
                      {{ $t('tag') }}
                    </UnnnicButton>
                  </template>
                  <OnClickOutside @trigger="openDropdownTags = false">
                    <section
                      class="contact-info__about-support-header__buttons__dropdown"
                    >
                      <UnnnicCheckbox
                        v-for="tag in allTags"
                        :key="tag.uuid"
                        :modelValue="
                          roomTags.some((roomTag) => roomTag.uuid === tag.uuid)
                        "
                        :textRight="tag.name"
                        @change="handleTagClick(tag)"
                      />
                    </section>
                  </OnClickOutside>
                </UnnnicDropdown>

                <UnnnicToolTip
                  enabled
                  :text="$t('discussions.start_discussion.title')"
                  side="left"
                >
                  <UnnnicButton
                    v-if="!isViewMode && !isMobile"
                    iconCenter="forum"
                    size="small"
                    type="secondary"
                    @click="handleModalStartDiscussion()"
                  />
                </UnnnicToolTip>
              </section>
            </header>
            <section class="contact-info__about-support-content">
              <TagGroup
                v-if="roomTags?.length > 0"
                class="contact-info__about-support-content__tag-group"
                :modelValue="roomTags"
                :tags="roomTags"
                selectable
                disableClick
                :useCloseClick="!isViewMode && !isHistory && room.user"
                @close="handleTagClick"
              />
              <ProtocolText :protocol="contactProtocol" />
              <DiscussionsSession v-if="isHistory" />
            </section>
          </section>
        </AsideSlotTemplateSection>

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

      <ModalStartDiscussion
        v-if="isShowModalStartDiscussion"
        @close="handleModalStartDiscussion()"
      />

      <FullscreenPreview
        v-if="isFullscreen"
        :downloadMediaUrl="currentMedia?.url"
        :downloadMediaName="currentMedia?.message"
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

import { mapActions, mapState, mapWritableState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

import ContactInfosLoading from '@/views/loadings/ContactInfos.vue';

import Room from '@/services/api/resources/chats/room';
import LinkContact from '@/services/api/resources/chats/linkContact';

import unnnic from '@weni/unnnic-system';

import CustomField from './CustomField.vue';
import ContactMedia from './Media.vue';
import VideoPreview from '../MediaMessage/Previews/Video.vue';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';
import ModalStartDiscussion from './ModalStartDiscussion.vue';
import DiscussionsSession from './DiscussionsSession.vue';
import ProtocolText from './ProtocolText.vue';

import Queues from '@/services/api/resources/settings/queue';
import TagGroup from '@/components/TagGroup.vue';
import { OnClickOutside } from '@vueuse/components';

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
    ContactMedia,
    FullscreenPreview,
    VideoPreview,
    ModalStartDiscussion,
    DiscussionsSession,
    ProtocolText,
    TagGroup,
    OnClickOutside,
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
    isShowModalStartDiscussion: false,
    openCustomFields: true,
    openDropdownTags: false,
    allTags: [],
  }),

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      activeRoomSummary: 'activeRoomSummary',
      isLoadingActiveRoomSummary: 'isLoadingActiveRoomSummary',
    }),
    ...mapWritableState(useRooms, {
      roomTags: 'activeRoomTags',
    }),

    hasCustomFields() {
      return Object.keys(this.computedCustomFields).length > 0;
    },

    computedCustomFields() {
      const customFields = this.room?.custom_fields || {};
      const roomService = this.contactService;
      if (roomService?.length > 0) {
        customFields[this.$t('service')] = roomService;
      }
      return customFields;
    },

    hideTagCloseIcon() {
      return this.isViewMode || this.isHistory || !this.room.user
        ? 'none'
        : 'flex';
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
    contactProtocol() {
      return (this.closedRoom || this.room).protocol || '';
    },
    contactService() {
      return (this.closedRoom || this.room).service_chat;
    },
  },
  watch: {
    room: {
      immediate: true,
      handler(newRoom) {
        if (newRoom) {
          this.customFields = newRoom.custom_fields;
          this.loadAllTags();
          this.loadRoomTags();
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

    this.customFields = (closedRoom || room)?.custom_fields;

    if (this.isHistory) {
      return;
    }

    this.loadAllTags();
    this.loadRoomTags();

    if (
      moment((closedRoom || room).contact.created_on).format('YYYY-MM-DD') <
      moment().format('YYYY-MM-DD')
    ) {
      this.contactHaveHistory = true;
    }

    this.loadLinkedContact();

    if (!room.queue?.sector) {
      throw new Error(`There is no associated sector with room ${room.uuid}`);
    }
  },

  unmounted() {
    this.roomTags = [];
  },

  methods: {
    moment,
    ...mapActions(useRooms, ['updateRoomContact']),
    async loadAllTags() {
      const { queue } = this.room || {};

      if (!queue) return;
      const { results } = await Queues.tags(queue.uuid, 0, 9999);

      this.allTags = results;
    },
    async loadRoomTags() {
      const roomUuid = this.closedRoom?.uuid || this.room?.uuid;
      const { results } = await Room.getRoomTags(roomUuid);
      this.roomTags = results;
    },
    async removeRoomTag(tag) {
      try {
        await Room.removeRoomTag(this.room.uuid, tag.uuid);
        this.roomTags = this.roomTags.filter(
          (roomTag) => roomTag.uuid !== tag.uuid,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async addRoomTag(tag) {
      try {
        await Room.addRoomTag(this.room.uuid, tag.uuid);
        this.roomTags.push(tag);
      } catch (error) {
        console.log(error);
      }
    },

    handleTagClick(tag) {
      console.log('handleTagClick', tag);
      const hasSelectedTag = this.roomTags.some(
        (roomTag) => roomTag.uuid === tag.uuid,
      );
      if (hasSelectedTag) {
        this.removeRoomTag(tag);
      } else {
        this.addRoomTag(tag);
      }
    },
    emitClose() {
      this.$emit('close');
    },

    handleModalStartDiscussion() {
      this.isShowModalStartDiscussion = !this.isShowModalStartDiscussion;
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
          currentCustomFieldValue !== this.customFields[currentCustomFieldKey]
        ) {
          Room.updateCustomFields(this.room.uuid, this.currentCustomField);
        }

        this.customFields[currentCustomFieldKey] = currentCustomFieldValue;
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

  background-color: $unnnic-color-background-snow;
}

.contact-info {
  &__section {
    padding: $unnnic-space-2;
  }
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $unnnic-space-4 $unnnic-space-2;
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    border-bottom: 1px solid $unnnic-color-border-soft;
  }

  &__about-support {
    &-content {
      // This is required to remove the tag icon
      :deep(.contact-info__about-support-content__tag-group) {
        .unnnic-icon {
          display: v-bind(hideTagCloseIcon);
        }
      }
    }
    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      &__buttons {
        display: flex;
        align-items: center;
        gap: $unnnic-space-1;
        :deep(.unnnic-dropdown__content) {
          padding: $unnnic-space-2;
        }
        &__dropdown {
          display: flex;
          flex-direction: column;
          gap: $unnnic-space-1;
          width: max-content;
          max-height: 110px;
          overflow-y: auto;

          padding-right: $unnnic-space-2;
        }
      }
    }
    &-title {
      font: $unnnic-font-emphasis;
      color: $unnnic-color-fg-emphasized;
      &-container {
        display: flex;
        flex-direction: column;
        gap: $unnnic-space-1;
      }
    }

    :deep(.unnnic-tooltip) {
      display: flex;
    }
  }

  .scrollable {
    overflow: hidden auto;
    height: 100%;
  }

  .aside-slot-template-section {
    width: 100%;

    background-color: $unnnic-color-background-snow;
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
        gap: $unnnic-space-05;

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
