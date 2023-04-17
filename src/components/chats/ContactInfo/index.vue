<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <aside-slot-template
    class="contact-info"
    :title="$t('contact_information')"
    @action="$listeners.close"
  >
    <section v-if="!isHistory" class="scrollable" style="background-color: #ffffff">
      <aside-slot-template-section>
        <section class="infos">
          <p class="username">
            {{ room.contact.name }}
          </p>

          <div class="connection-info">
            <p v-if="room.contact.status === 'online'">
              {{ $t('status.online') }}
            </p>
            <template>
              <p style="margin-bottom: 0.75rem">
                <span class="title"> {{ contactNumber.plataform }}: </span>
                {{ contactNumber.contactNum }}
              </p>
            </template>
            <template v-if="!!room.custom_fields">
              <p v-for="(value, key) in customFields" :key="key">
                <span class="title"> {{ key }}: </span>
                {{ value }}
              </p>
            </template>
            <p v-if="lastMessageFromContact?.created_on" style="margin-bottom: 16px">
              {{
                $t('last_message_time.date', {
                  date: moment(lastMessageFromContact?.created_on).fromNow(),
                })
              }}
            </p>
            <unnnic-button
              v-if="!isHistory"
              class="transfer__button"
              text="Ver histórico do contato"
              iconLeft="export-1"
              type="secondary"
              size="small"
              @click="openHistory()"
            />
            <div
              style="display: flex; margin-left: -8px; align-items: center"
              v-if="!isLinkedToOtherAgent"
            >
              <unnnicSwitch
                :value="isLinkedUser"
                @input="addContactToAgent"
                size="small"
                :textRight="
                  isLinkedUser
                    ? $t('switch_contact_info.switch_disassociate_contact')
                    : $t('switch_contact_info.switch_associate_contact')
                "
              />
              <unnnic-tool-tip
                enabled
                :text="$t('switch_contact_info.switch_tooltip')"
                side="bottom"
                maxWidth="21rem"
              >
                <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
              </unnnic-tool-tip>
            </div>
            <div v-if="isLinkedToOtherAgent">
              <span>{{
                $t('switch_contact_info.linked_contact', {
                  name: this.room.linked_user,
                })
              }}</span>
            </div>
          </div>
        </section>
      </aside-slot-template-section>

      <aside-slot-template-section>
        <p class="title-transfer-chat">Transferir contato</p>
        <div style="margin-top: 20px; margin-bottom: 20px">
          <unnnic-radio size="sm" v-model="transferRadio" value="agent"> Agente </unnnic-radio>

          <unnnic-radio size="sm" v-model="transferRadio" value="queue"> Fila </unnnic-radio>
        </div>
        <section class="transfer-section">
          <unnnic-autocomplete
            v-model="transferContactSearch"
            :data="
              transferRadio === `queue`
                ? transferOptions.map((option) => `${option.name} | Setor ${option.sector_name}`)
                : transferOptions.map((option) => `${option.name}`)
            "
            @choose="transferContactTo = $event"
            :placeholder="
              transferRadio === 'queue'
                ? (transferLabel = $t('select_queue'))
                : transferRadio === 'agent'
                ? (transferLabel = $t('select_agent'))
                : (transferLabel = $t('select_sector'))
            "
            open-with-focus
            size="sm"
            highlight
            class="channel-select"
            :disabled="!!transferContactError"
            :message="transferContactError"
          />

          <unnnic-button
            class="transfer__button"
            :text="$t('transfer')"
            type="secondary"
            size="small"
            @click="transferContact"
          />
        </section>
      </aside-slot-template-section>

      <aside-slot-template-section>
        <contact-media
          :room="room"
          @fullscreen="openFullScreen"
          :history="isHistory"
          :contactInfo="contact"
        />
      </aside-slot-template-section>
    </section>

    <section v-if="isHistory" class="scrollable" style="background-color: #ffffff">
      <aside-slot-template-section>
        <section class="infos">
          <div class="connection-info">
            <p class="username">
              {{ contact.name }}
            </p>
            <template>
              <p style="margin-bottom: 0.75rem">
                <span class="title"> {{ contactNumberClosedChat.plataform }}: </span>
                {{ contactNumberClosedChat.contactNum }}
              </p>
            </template>
            <div class="connection-info">
              <template v-if="!!contact.custom_fields">
                <p v-for="(value, key) in customFields" :key="key">
                  <span class="title"> {{ key }}: </span>
                  {{ value }}
                </p>
              </template>
            </div>
          </div>
        </section>
      </aside-slot-template-section>

      <aside-slot-template-section>
        <contact-media
          :room="room"
          @fullscreen="openFullScreen"
          :history="isHistory"
          :contactInfo="contact"
        />
      </aside-slot-template-section>
    </section>
    <unnnic-modal
      :text="$t('successfully_transferred_chat')"
      :description="$t('successfully_transferred_contact_to.line', { name: transferContactTo })"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showSuccessfulTransferModal"
      @close="
        $store.commit('chats/setActiveChat', null),
          (showSuccessfulTransferModal = false),
          navigate('home')
      "
    />
    <fullscreen-preview
      v-if="isFullscreen"
      @download="$emit('download')"
      @close="isFullscreen = false"
      @next="nextMedia"
      @previous="previousMedia"
    >
      <video
        v-if="currentMedia.content_type.includes('mp4')"
        controls
        @keypress.enter="() => {}"
        @click.stop="() => {}"
      >
        <source :src="currentMedia.url" />
      </video>
      <img
        v-else
        :src="currentMedia.url"
        :alt="currentMedia.url"
        @keypress.enter="() => {}"
        @click.stop="() => {}"
      />
    </fullscreen-preview>
  </aside-slot-template>
</template>

<script>
import { mapState } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import Room from '@/services/api/resources/chats/room';
import Sector from '@/services/api/resources/settings/sector';
import LinkContact from '@/services/api/resources/chats/linkContact';
import { unnnicCallAlert } from '@weni/unnnic-system';
import Queue from '@/services/api/resources/settings/queue';
import ContactMedia from './Media';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';

const moment = require('moment');

export default {
  name: 'ContactInfo',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    ContactMedia,
    FullscreenPreview,
  },
  props: {
    contact: {
      type: Object,
    },
    isHistory: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    transferOptions: [],
    queues: [],
    transferContactSearch: '',
    transferContactTo: '',
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
  }),

  computed: {
    ...mapState({
      room: (state) => state.rooms.activeRoom,
    }),

    lastMessageFromContact() {
      const messages = this.$store.state.rooms.activeRoomMessages;
      return messages.findLast((message) => message.contact);
    },

    transferPersonSelected() {
      if (this.transferRadio === 'queue') {
        const takeTheName = this.transferContactSearch.split('|').at(0);
        const removeTheSpace = takeTheName.split(' ').at(0);
        return this.transferOptions.find((option) => option.name === removeTheSpace);
      }
      return this.transferOptions.find((option) => option.name === this.transferContactSearch);
    },

    customFields() {
      return this.room.custom_fields;
    },

    contactNumber() {
      const plataform = this.room.urn.split(':').at(0);
      const number = this.room.urn.split(':').at(-1);
      const whatsapp = `+ ${number.substr(-20, 20)} `;
      const infoNumber = {
        plataform,
        contactNum: plataform === 'whatsapp' ? whatsapp : number,
      };
      return infoNumber;
    },
    contactNumberClosedChat() {
      const plataform = this.contact.room.urn.split(':').at(0);
      const number = this.contact.room.urn.split(':').at(-1);
      const whatsapp = `+ ${number.substr(-20, 20)} `;
      const infoNumber = {
        plataform,
        contactNum: plataform === 'whatsapp' ? whatsapp : number,
      };
      return infoNumber;
    },
  },

  async created() {
    if (!this.isHistory) {
      if (
        moment(this.room.contact.created_on).format('YYYY-MM-DD') < moment().format('YYYY-MM-DD')
      ) {
        this.contactHaveHistory = true;
      }
      this.transferLabel = this.$t('select_agent');
      this.loadLinkedContact();
      if (!this.room.queue?.sector) {
        throw new Error(`There is no associated sector with room ${this.room.uuid}`);
      }

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
    }
  },

  methods: {
    moment,
    openHistory() {
      window.open(`/closed-chats?contactId=${this.room.contact.uuid}`);
    },

    async getQueues() {
      this.loading = true;
      let hasNext = false;
      try {
        const queues = await Queue.list(this.room.queue.sector, this.page * 10, 10);
        this.page += 1;
        this.transferOptions = this.queues.concat(queues.results);

        hasNext = queues.next;

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
        this.showStatusAlert(this.$t('switch_contact_info.alert_linked'));
        this.verifyLinkedUser();
      } catch (error) {
        console.log(error);
      }
    },

    async removeLinkedContact() {
      const contact = this.room.contact.uuid;
      try {
        await LinkContact.removeContactFromAgent(contact);
        this.showStatusAlert(this.$t('switch_contact_info.alert_detached'));
        this.verifyLinkedUser();
      } catch (error) {
        console.log(error);
      }
    },

    showStatusAlert(status) {
      unnnicCallAlert({
        props: {
          title: ``,
          text: `${status}`,
          icon: 'check-circle-1-1-1',
          scheme: 'feedback-green',
          closeText: 'Fechar',
          position: 'bottom-right',
          size: 'small',
        },
        seconds: 10,
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

        return this.$t('last_online_time.date', { date: formattedDate, time: formattedTime });
      }

      const dateDifferenceInMinutes = dateDifferenceInHours * 60;
      return dateDifferenceInMinutes > 60
        ? this.$t('last_online_time.hours', { hours: Number.parseInt(dateDifferenceInHours, 10) })
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
      console.log(this.transferPersonSelected, `this.transferPersonSelected`);
      this.$store.commit('chats/removeChat', this.room);
      if (this.transferRadio === 'agent') {
        await Room.take(this.room.uuid, this.transferPersonSelected.email);
      }
      if (this.transferRadio === 'queue') {
        await Room.take(this.room.uuid, null, this.transferPersonSelected.uuid);
      }
      this.showSuccessfulTransferModal = true;
    },
  },
  watch: {
    transferRadio: {
      handler() {
        if (this.transferRadio === 'queue') {
          this.transferContactSearch = '';
          this.page = 0;
          this.getQueues();
        }
        if (this.transferRadio === 'sector') {
          this.transferContactSearch = '';
          this.listSectors();
        }
        if (this.transferRadio === 'agent') {
          this.transferContactSearch = '';
          this.listAgents();
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-info {
  .scrollable {
    overflow-y: auto;
    height: 100%;
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
      color: $unnnic-color-aux-purple;
    }

    .connection-info {
      display: flex;
      flex-direction: column;
      gap: $unnnic-spacing-stack-nano;

      font-size: $unnnic-font-size-body-md;
      color: $unnnic-color-neutral-cloudy;

      .title {
        font-weight: $unnnic-font-weight-bold;
      }
    }
  }

  .title-transfer-chat {
    font-weight: $unnnic-font-weight-bold;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-aux-purple;
  }

  .transfer-section {
    .transfer__button {
      margin-top: $unnnic-spacing-inline-sm;
      width: 100%;
    }
  }
}
</style>
