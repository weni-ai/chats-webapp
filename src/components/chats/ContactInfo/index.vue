<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="contact-info__container">
    <contact-infos-loading v-show="isLoading" />
    <aside-slot-template
      v-show="!isLoading"
      v-if="closedRoom || room"
      class="contact-info"
      :title="$t('contact_info.title')"
      icon="info"
      :close="$listeners.close"
    >
      <section class="scrollable">
        <aside-slot-template-section>
          <section class="infos">
            <header class="connection-info__header">
              <h1 class="username">
                {{ (closedRoom || room).contact.name }}
              </h1>

              <unnnic-button
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
              <p v-if="lastMessageFromContact?.created_on" style="margin-bottom: 12px">
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
                  <hgroup class="info" v-if="contactProtocol.length > 0">
                    <h3 class="title">Protocolo:</h3>
                    <h4 class="description">{{ contactProtocol }}</h4>
                  </hgroup>
                </section>
              </template>
              <template v-if="!isHistory && !!room.custom_fields">
                <custom-field
                  v-for="(value, key) in customFields"
                  :key="key"
                  :title="key"
                  :description="value"
                  :is-editable="room.can_edit_custom_fields"
                  :is-current="isCurrentCustomField(key)"
                  :value="currentCustomField?.[key]"
                  @update-current-custom-field="updateCurrentCustomField"
                  @save-value="saveCurrentCustomFieldValue"
                />
              </template>
            </div>
            <div v-if="!isLinkedToOtherAgent && !isViewMode && !isHistory" class="sync-contact">
              <unnnicSwitch
                :value="isLinkedUser"
                @input="addContactToAgent"
                size="small"
                :textRight="
                  isLinkedUser
                    ? $t('contact_info.switch_disassociate_contact')
                    : $t('contact_info.switch_associate_contact')
                "
              />
              <unnnic-tool-tip
                enabled
                :text="$t('contact_info.switch_tooltip')"
                side="bottom"
                maxWidth="21rem"
              >
                <unnnic-icon-svg icon="info" scheme="neutral-cloudy" size="sm" />
              </unnnic-tool-tip>
            </div>
            <nav class="infos__nav">
              <unnnic-button
                v-if="!isHistory && !isViewMode"
                :text="$t('contact_info.see_contact_history')"
                iconLeft="history"
                type="secondary"
                size="small"
                @click="openHistory()"
              />
              <unnnic-button
                v-if="!isViewMode"
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
        </aside-slot-template-section>

        <discussions-session v-if="isHistory" />
        <aside-slot-template-section v-if="!isHistory">
          <p class="title-transfer-chat">
            {{ $t('contact_info.transfer_contact') }}
          </p>
          <div style="margin-top: 20px; margin-bottom: 20px">
            <unnnic-radio size="sm" v-model="transferRadio" value="agent" :disabled="isViewMode">
              {{ $t('agent') }}
            </unnnic-radio>

            <unnnic-radio size="sm" v-model="transferRadio" value="queue" :disabled="isViewMode">
              {{ $t('queue') }}
            </unnnic-radio>
          </div>
          <section class="transfer-section">
            <unnnic-select-smart
              v-model="transferContactTo"
              :options="transferOptions"
              autocomplete
              autocompleteIconLeft
              autocompleteClearOnFocus
              :disabled="!!transferContactError || isViewMode"
            />

            <unnnic-button
              class="transfer__button"
              :text="$t('transfer')"
              type="secondary"
              size="small"
              @click="transferContact"
              :disabled="isViewMode"
            />
          </section>
        </aside-slot-template-section>

        <aside-slot-template-section>
          <contact-media
            :room="room"
            @fullscreen="openFullScreen"
            :history="isHistory"
            :contactInfo="(closedRoom || room).contact"
            @loaded-medias="isLoading = false"
          />
        </aside-slot-template-section>
      </section>

      <modal-start-discussion
        :showModal="isShowModalStartDiscussion"
        @close="handleModalStartDiscussion()"
      />
      <unnnic-modal
        :text="$t('successfully_transferred_chat')"
        :description="
          $t('successfully_transferred_contact_to.line', {
            name: transferContactTo?.[0]?.label || '',
          })
        "
        modalIcon="check-circle-1-1"
        scheme="feedback-green"
        :showModal="showSuccessfulTransferModal"
        @close="
          $store.dispatch('chats/rooms/setActiveRoom', null),
            (showSuccessfulTransferModal = false),
            navigate('home')
        "
      />
      <fullscreen-preview
        v-if="isFullscreen"
        :downloadMediaUrl="currentMedia?.url"
        :downloadMediaName="currentMedia?.message"
        @close="isFullscreen = false"
        @next="nextMedia"
        @previous="previousMedia"
      >
        <video-preview
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
      </fullscreen-preview>
    </aside-slot-template>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';

import ContactInfosLoading from '@/views/loadings/ContactInfos.vue';

import Room from '@/services/api/resources/chats/room';
import Sector from '@/services/api/resources/settings/sector';
import LinkContact from '@/services/api/resources/chats/linkContact';
import Queue from '@/services/api/resources/settings/queue';

import { unnnicCallAlert } from '@weni/unnnic-system';

import CustomField from './CustomField';
import ContactMedia from './Media';
import VideoPreview from '../MediaMessage/Previews/Video';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';
import ModalStartDiscussion from './ModalStartDiscussion';
import DiscussionsSession from './DiscussionsSession';

const moment = require('moment');

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
    transferOptions: [],
    queues: [],
    transferContactTo: [],
    transferContactError: '',
    showSuccessfulTransferModal: false,
    isLinkedUser: false,
    isLinkedToOtherAgent: false,
    isFullscreen: false,
    currentMedia: {},
    images: [],
    transferRadio: 'agent',
    transferLabel: '',
    page: 0,
    contactHaveHistory: false,
    customFields: [],
    currentCustomField: {},
    isRefreshContactDisabled: false,
    isShowModalStartDiscussion: false,
  }),

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
    }),

    lastMessageFromContact() {
      const messages = this.$store.state.chats.roomMessages.roomMessages;
      if (messages) {
        return messages.findLast((message) => message.contact);
      }
      return '';
    },

    transferPersonSelected() {
      const selectedOptionValue = this.transferContactTo?.[0]?.value;
      return this.transferOptions.find((option) => option.value === selectedOptionValue);
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
    if (this.isHistory) {
      return;
    }

    const { room } = this;

    this.customFields = room.custom_fields;

    if (
      moment((this.closedRoom || room).contact.created_on).format('YYYY-MM-DD') <
      moment().format('YYYY-MM-DD')
    ) {
      this.contactHaveHistory = true;
    }
    this.transferLabel = this.$t('select_agent');
    this.loadLinkedContact();
    if (!room.queue?.sector) {
      throw new Error(`There is no associated sector with room ${room.uuid}`);
    }

    try {
      const treatedAgents = [{ value: '', label: this.$t('select_agent') }];
      const agents = (await Sector.agents({ sectorUuid: room.queue.sector })).filter(
        (agent) => agent.email !== this.$store.state.profile.me.email,
      );

      agents.forEach(({ first_name, last_name, email }) => {
        treatedAgents.push({
          label: [first_name, last_name].join(' ').trim() || email,
          value: email,
        });
      });
      this.transferOptions = treatedAgents;
    } catch (error) {
      if (error?.response?.status === 403) {
        this.transferContactError = this.$t('chats.transfer.does_not_have_permission');
      } else {
        throw error;
      }
    }
  },

  methods: {
    moment,
    openHistory() {
      const { plataform, contactNum } = this.contactNumber;
      const protocol = this.contactProtocol;
      const contactUrn = plataform === 'whatsapp' ? contactNum.replace('+', '') : contactNum;

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

    handleModalStartDiscussion() {
      this.isShowModalStartDiscussion = !this.isShowModalStartDiscussion;
    },

    async getQueues() {
      this.loading = true;
      let hasNext = false;
      try {
        const newQueues = await Queue.listByProject(this.page * 10, 10);
        this.page += 1;

        const treatedQueues = [{ value: '', label: this.$t('select_queue') }];
        this.queues.concat(newQueues.results).forEach(({ name, sector_name, uuid }) => {
          treatedQueues.push({
            label: `${name} | ${this.$t('sector.title')} ${sector_name}`,
            value: uuid,
          });
        });
        this.transferOptions = treatedQueues;

        hasNext = newQueues.next;

        this.loading = false;
      } finally {
        this.loading = false;
      }
      if (hasNext) {
        this.getQueues();
      }
    },

    async listAgents() {
      try {
        this.transferOptions = (await Sector.agents({ sectorUuid: this.room.queue.sector }))
          .filter((agent) => agent.email !== this.$store.state.profile.me.email)
          .map(({ first_name, last_name, email }) => {
            return {
              name: [first_name, last_name].join(' ').trim() || email,
              email,
            };
          });
      } catch (error) {
        if (error?.response?.status === 403) {
          this.transferContactError = this.$t('chats.transfer.does_not_have_permission');
        } else {
          throw error;
        }
      }
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
      const currentCustomFieldValue = this.currentCustomField[currentCustomFieldKey];

      if (currentCustomFieldValue) {
        if (currentCustomFieldValue !== this.customFields[currentCustomFieldKey]) {
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
      const imageIndex = this.images.findIndex((el) => el.url === this.currentMedia.url);
      if (imageIndex + 1 < this.images.length) {
        this.currentMedia = this.images[imageIndex + 1];
      }
    },

    previousMedia() {
      const imageIndex = this.images.findIndex((el) => el.url === this.currentMedia.url);
      if (imageIndex - 1 >= 0) {
        this.currentMedia = this.images[imageIndex - 1];
      }
    },

    addContactToAgent() {
      if (!this.isLinkedUser) {
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
        await this.$store.dispatch('chats/rooms/updateRoomContact', { uuid });

        this.showAlert('Informações atualizadas');
      } catch (error) {
        console.error('Erro ao atualizar as informações do contato.', error);
      }
    },

    showAlert(text, type = 'success') {
      unnnicCallAlert({
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
      const dateDifferenceInHours = this.getDatesDifferenceInHours(today, lastViewDate);

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
    async transferContact() {
      if (this.transferRadio === 'agent') {
        await Room.take(this.room.uuid, this.transferPersonSelected.value);
      }
      if (this.transferRadio === 'queue') {
        await Room.take(this.room.uuid, null, this.transferPersonSelected.value);
      }
      this.showSuccessfulTransferModal = true;
    },
  },
  watch: {
    room(newRoom) {
      if (!this.isHistory) {
        this.customFields = newRoom.custom_fields;
      }
    },
    transferRadio: {
      handler() {
        if (this.transferRadio === 'queue') {
          this.transferContactTo = [];
          this.page = 0;
          this.getQueues();
        }
        if (this.transferRadio === 'agent') {
          this.transferContactTo = [];
          this.listAgents();
        }
      },
    },
    transferContactError(error) {
      this.showAlert(error, 'error');
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-info__container {
  height: 100%;

  overflow: hidden;
}

.contact-info {
  .scrollable {
    overflow: hidden auto;
    height: 100%;
  }

  section {
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
      background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
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

  .title-transfer-chat {
    font-weight: $unnnic-font-weight-bold;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-dark;
  }

  .transfer-section {
    .transfer__button {
      margin-top: $unnnic-spacing-inline-sm;
      width: 100%;
    }
  }
}
</style>
