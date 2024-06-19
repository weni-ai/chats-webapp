<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="contact-info__container">
    <ContactInfosLoading v-show="isLoading" />
    <AsideSlotTemplate
      v-show="!isLoading"
      v-if="closedRoom || room"
      class="contact-info"
      :title="$t('contact_info.title')"
      :subtitle="headerMobileSubtitle"
      :avatarName="headerMobileSubtitle"
      :icon="headerDesktopIcon"
      :close="emitClose"
      :back="headerMobileBack"
    >
      <section class="scrollable">
        <AsideSlotTemplateSection>
          <section class="infos">
            <header class="connection-info__header">
              <h1 class="username">
                {{ (closedRoom || room).contact.name }}
              </h1>
              <UnnnicButton
                v-if="!isHistory"
                iconCenter="sync"
                type="tertiary"
                size="small"
                @click="refreshContactInfos"
                :disabled="isRefreshContactDisabled"
              />
            </header>

            <div class="connection-info">
              <p v-if="room?.contact.status === 'online'">
                {{ $t('status.online') }}
              </p>
              <p
                v-if="lastMessageFromContact?.created_on"
                style="margin-bottom: 12px"
              >
                {{
                  $t('last_message_time.date', {
                    date: moment(lastMessageFromContact?.created_on).fromNow(),
                  })
                }}
              </p>
              <template>
                <section class="infos">
                  <hgroup class="info">
                    <h3 class="title">{{ contactNumber.plataform }}:</h3>
                    <h4 class="description">{{ contactNumber.contactNum }}</h4>
                  </hgroup>
                  <hgroup
                    class="info"
                    v-if="contactProtocol?.length > 0"
                  >
                    <h3 class="title">{{ $t('protocol') }}:</h3>
                    <h4 class="description">{{ contactProtocol }}</h4>
                  </hgroup>
                </section>
              </template>
              <template v-if="!!room.custom_fields">
                <CustomField
                  v-for="(value, key) in customFields"
                  :key="key"
                  :title="key"
                  :description="value"
                  :isEditable="!isHistory && room.can_edit_custom_fields"
                  :isCurrent="isCurrentCustomField(key)"
                  :value="currentCustomField?.[key]"
                  @update-current-custom-field="updateCurrentCustomField"
                  @save-value="saveCurrentCustomFieldValue"
                />
              </template>
            </div>
            <div
              v-if="!isLinkedToOtherAgent && !isViewMode && !isHistory"
              class="sync-contact"
            >
              <UnnnicSwitch
                v-model="isLinkedUser"
                @update:model-value="addContactToAgent"
                size="small"
                :textRight="
                  isLinkedUser
                    ? $t('contact_info.switch_disassociate_contact')
                    : $t('contact_info.switch_associate_contact')
                "
              />
              <UnnnicToolTip
                enabled
                :text="$t('contact_info.switch_tooltip')"
                side="bottom"
                maxWidth="21rem"
              >
                <UnnnicIconSvg
                  icon="info"
                  scheme="neutral-cloudy"
                  size="sm"
                />
              </UnnnicToolTip>
            </div>
            <nav class="infos__nav">
              <UnnnicButton
                v-if="!isHistory && !isViewMode"
                :text="$t('contact_info.see_contact_history')"
                iconLeft="history"
                type="secondary"
                size="small"
                @click="openHistory()"
              />
              <UnnnicButton
                v-if="!isViewMode && !isMobile"
                :text="$t('discussions.start_discussion.title')"
                iconLeft="forum"
                type="primary"
                size="small"
                @click="handleModalStartDiscussion()"
              />
            </nav>
            <div v-if="isLinkedToOtherAgent">
              <span>{{
                $t('contact_info.linked_contact', {
                  name: this.room.linked_user,
                })
              }}</span>
            </div>
          </section>
        </AsideSlotTemplateSection>

        <DiscussionsSession v-if="isHistory" />

        <TransferSession
          v-if="!isHistory"
          @transferred-contact="$emit('transferred-contact')"
        />

        <AsideSlotTemplateSection>
          <ContactMedia
            :room="room"
            @fullscreen="openFullScreen"
            :history="isHistory"
            :contactInfo="(closedRoom || room).contact"
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
          @keypress.enter="() => {}"
          @click.stop="() => {}"
          :src="currentMedia.url"
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
import ContactMedia from './Media.vue';
import VideoPreview from '../MediaMessage/Previews/Video.vue';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';
import TransferSession from './TransferSession.vue';
import ModalStartDiscussion from './ModalStartDiscussion.vue';
import DiscussionsSession from './DiscussionsSession.vue';

import moment from 'moment';

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
    TransferSession,
    ModalStartDiscussion,
    DiscussionsSession,
  },
  props: {
    closedRoom: {
      type: Object,
    },
    isHistory: {
      type: Boolean,
      default: false,
    },
    isViewMode: {
      type: Boolean,
      default: false,
    },
  },

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
    customFields: [],
    currentCustomField: {},
    isRefreshContactDisabled: false,
    isShowModalStartDiscussion: false,
  }),

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),

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
      const plataform = (this.closedRoom || this.room).urn.split(':').at(0);
      const number = (this.closedRoom || this.room).urn.split(':').at(-1);
      const whatsapp = `+${number.substr(-20, 20)}`;
      const infoNumber = {
        plataform,
        contactNum: plataform === 'whatsapp' ? whatsapp : number,
      };
      return infoNumber;
    },
    contactProtocol() {
      return (this.closedRoom || this.room).protocol;
    },
  },

  async created() {
    const { closedRoom, room } = this;

    this.customFields = (closedRoom || room)?.custom_fields;

    if (this.isHistory) {
      return;
    }

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
    this.emitClose();
  },

  methods: {
    moment,
    ...mapActions(useRooms, ['updateRoomContact']),
    openHistory() {
      const { plataform, contactNum } = this.contactNumber;
      const protocol = this.contactProtocol;
      const contactUrn =
        plataform === 'whatsapp' ? contactNum.replace('+', '') : contactNum;

      const A_YEAR_AGO = moment().subtract(12, 'month').format('YYYY-MM-DD');

      this.$router.push({
        name: 'closed-rooms',
        query: {
          contactUrn,
          protocol,
          startDate: A_YEAR_AGO,
        },
      });
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

        this.showAlert('Informações atualizadas');
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
  watch: {
    room(newRoom) {
      this.customFields = newRoom.custom_fields;
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-info__container {
  height: 100%;

  overflow: hidden;

  background-color: $unnnic-color-background-snow;
}

.contact-info {
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

    .avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: $unnnic-border-radius-lg;

      width: 100%;
      min-height: 17.8125rem;
      background: rgba(
        $unnnic-color-brand-weni,
        $unnnic-opacity-level-extra-light
      );
    }

    .username {
      font-weight: $unnnic-font-weight-bold;
      font-size: $unnnic-font-size-title-sm;
      color: $unnnic-color-neutral-dark;
    }

    .connection-info {
      display: flex;
      flex-direction: column;
      gap: $unnnic-spacing-stack-nano;

      font-size: $unnnic-font-size-body-md;
      color: $unnnic-color-neutral-cloudy;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .infos {
        display: flex;
        flex-direction: column;
        gap: $unnnic-spacing-inline-nano;

        &:not(.custom) {
          margin-bottom: $unnnic-spacing-inline-ant;
        }
      }

      .info {
        display: flex;
        align-items: center;
        gap: $unnnic-spacing-inline-nano;

        .title {
          font-weight: $unnnic-font-weight-bold;
          text-transform: capitalize;
        }

        .title,
        .description {
          font-size: $unnnic-font-size-body-gt;
          cursor: default;
        }
      }
    }

    .sync-contact {
      margin-left: -$unnnic-spacing-xs;

      display: flex;
      align-items: center;

      :deep(.unnnic-tooltip) {
        display: flex;
      }
    }

    &__nav {
      display: grid;
      gap: $unnnic-spacing-xs;
    }
  }
}
</style>
