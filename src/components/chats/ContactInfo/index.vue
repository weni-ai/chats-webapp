<template>
  <aside-slot-template
    class="contact-info"
    :title="$t('contact_information')"
    @action="$listeners.close"
  >
    <section v-if="!isHistory" class="scrollable" style="background-color: #ffffff">
      <aside-slot-template-section>
        <section class="infos">
          <!-- <div class="avatar">
            <unnnic-icon-svg icon="single-neutral-actions-1" size="xl" />
          </div> -->

          <p class="username">
            {{ room.contact.name }}
          </p>

          <div class="connection-info">
            <p v-if="room.contact.status === 'online'">
              {{ $t('status.online') }}
            </p>
            <!-- <p v-else>{{ getLastTimeOnlineText(room.contact.last_interaction || new Date()) }}</p> -->
            <template v-if="!!room.custom_fields">
              <p v-for="(value, key) in customFields" :key="key">
                <span class="title"> {{ key }}: </span>
                {{ value }}
              </p>
            </template>
            <p v-if="lastMessageFromContact?.created_on">
              {{
                $t('last_message_time.date', {
                  date: moment(lastMessageFromContact?.created_on).fromNow(),
                })
              }}
            </p>
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
        <section class="transfer-section">
          <unnnic-autocomplete
            v-model="transferContactSearch"
            :data="transferOptions.map((option) => option.name)"
            @choose="transferContactTo = $event"
            :placeholder="$t('select_agent_line_or_department')"
            :label="$t('chats.transfer.title')"
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
            :disabled="!transferPersonSelected"
            @click="transferContact"
          />
        </section>
      </aside-slot-template-section>

      <aside-slot-template-section>
        <contact-media :room="room" />
      </aside-slot-template-section>
    </section>

    <section v-if="isHistory" class="scrollable" style="background-color: #ffffff">
      <aside-slot-template-section>
        <section class="infos">
          <div class="avatar">
            <unnnic-icon-svg icon="single-neutral-actions-1" size="xl" />
          </div>

          <p class="username">
            {{ contact.name }}
          </p>

          <div class="connection-info">
            <!-- <p v-else>{{ getLastTimeOnlineText(room.contact.last_interaction || new Date()) }}</p> -->
            <template v-if="!!contact.custom_fields">
              <p v-for="(value, key) in customFields" :key="key">
                <span class="title"> {{ key }}: </span>
                {{ value }}
              </p>
            </template>
            <!-- <p v-if="lastMessageFromContact?.created_on">
              {{
                $t('last_message_time.date', {
                  date: moment(lastMessageFromContact?.created_on).fromNow(),
                })
              }}
            </p> -->
          </div>
        </section>
      </aside-slot-template-section>

      <aside-slot-template-section>
        <contact-media :room="room" />
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
  </aside-slot-template>
</template>

<script>
import { mapState } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import Room from '@/services/api/resources/chats/room';
import Sector from '@/services/api/resources/settings/sector';
import Media from '@/services/api/resources/chats/media';
import LinkContact from '@/services/api/resources/chats/linkContact';
import { unnnicCallAlert } from '@weni/unnnic-system';
import ContactMedia from './Media';

const moment = require('moment');

export default {
  name: 'ContactInfo',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    ContactMedia,
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
    transferContactSearch: '',
    transferContactTo: '',
    transferContactError: '',
    showSuccessfulTransferModal: false,
    isLinkedUser: false,
    isLinkedToOtherAgent: false,
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
      return this.transferOptions.find((option) => option.name === this.transferContactSearch);
    },

    customFields() {
      return this.room.custom_fields;
    },
  },

  async created() {
    if (!this.isHistory) {
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
    } else {
      this.loadNextMedias();
    }
  },

  methods: {
    moment,

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

    async loadNextMedias() {
      const response = await Media.listFromContactAndClosedRoom({
        ordering: 'content_type',
        contact: this.contact.uuid,
        // room: this.room.uuid,
        page: this.page,
      });
      this.audios = await Promise.all(
        response.results
          .filter((media) => media.content_type.startsWith('audio/'))
          .map(
            (element) =>
              new Promise((resolve) => {
                const url = new Audio(element.url);
                url.onloadedmetadata = (event) => {
                  const { duration } = event.path[0];
                  resolve({ ...element, duration });
                };
              }),
          ),
      );
      this.medias = this.medias.concat(
        response.results.filter((media) => !media.content_type.startsWith('audio/')),
      );

      this.page += 1;

      if (response.next) {
        this.loadNextMedias();
      }
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
      this.$store.commit('chats/removeChat', this.room);
      await Room.take(this.room.uuid, this.transferPersonSelected.email);
      this.showSuccessfulTransferModal = true;
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

  .transfer-section {
    .transfer__button {
      margin-top: $unnnic-spacing-inline-sm;
      width: 100%;
    }
  }
}
</style>
