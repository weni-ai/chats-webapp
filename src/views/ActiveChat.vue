<template>
  <main-layout>
    <section class="active-chat">
      <header class="user-info">
        <span class="avatar">{{ activeChat.username.charAt(0) }}</span>
        <span class="username">{{ activeChat.username }}</span>
        <unnnicIcon class="close-icon" icon="close-1" size="sm" />
      </header>

      <div class="chat-begin">Início da conversa</div>

      <div class="divisor">
        <hr />
        <span class="date"> 20 de dezembro </span>
        <hr />
      </div>

      <section class="chat">
        <div class="message">
          <div class="user-info avatar-col">
            <span class="avatar">{{ activeChat.username.charAt(0) }}</span>
          </div>

          <div>
            <div class="user-info">
              <span class="username">{{ activeChat.username }}</span>
              <span class="time">10h15</span>
            </div>

            <div class="messages">
              <p>Oi</p>
              <p>Gostaria de saber se consigo pagar meu boleto depois do vencimento</p>
              <p>O boleto venceu ontem e eu não queria pagar juros</p>
              <p>Como faço?</p>
            </div>
          </div>
        </div>

        <div class="message">
          <div class="user-info avatar-col">
            <span class="avatar secondary-color">A</span>
          </div>

          <div>
            <div class="user-info">
              <span class="username">Atendente</span>
              <span class="time">10h20</span>
            </div>

            <div class="messages">
              <p>Olá, Ilanna</p>
              <p>Preciso confirmar com o financeiro, você me dá um minuto?</p>
            </div>
          </div>
        </div>

        <div class="message">
          <div class="user-info avatar-col">
            <span class="avatar">{{ activeChat.username.charAt(0) }}</span>
          </div>

          <div>
            <div class="user-info">
              <span class="username">{{ activeChat.username }}</span>
              <span class="time">10h15</span>
            </div>

            <div class="messages">
              <p>Claro! fico no aguardo</p>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main-layout>
</template>

<script>
import { unnnicIcon } from '@weni/unnnic-system';

import chats from '@/data/chats.json';

import MainLayout from '@/layouts/MainLayout';

export default {
  name: 'ActiveChat',

  components: {
    MainLayout,
    unnnicIcon,
  },

  data: () => ({
    activeChat: chats[1].chats[1],
  }),
};
</script>

<style lang="scss" scoped>
.active-chat {
  margin-left: 1.5rem;
  padding-right: 1.5rem;

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2rem;
      height: 2rem;
      border-radius: 0.125rem;

      border: solid 1px $unnnic-color-aux-pink;

      background: $unnnic-color-aux-pink;
      color: $unnnic-color-neutral-snow;
    }

    .username {
      flex: 1;
      font-weight: 400;
      line-height: 1.5rem;
      color: $unnnic-color-neutral-dark;
    }
  }

  .chat-begin {
    padding: 1.5rem 0 0.5rem;
    text-align: center;
    color: $unnnic-color-neutral-dark;
    line-height: 1.375rem;
    font-weight: 400;
    font-size: 0.875rem;
  }

  .divisor {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1rem;

    .date {
      font-weight: 700;
      font-size: 0.5rem;
      line-height: 1rem;
      color: $unnnic-color-neutral-dark;
    }

    hr {
      flex: 1;
      height: 0.125rem;
      border-color: $unnnic-color-neutral-lightest;
    }
  }

  .chat {
    .message {
      display: flex;
      gap: 1rem;

      & + .message {
        padding-top: 1.5rem;
      }

      .avatar-col {
        display: flex;
        align-items: flex-start;
      }

      .user-info {
        margin-bottom: 0.5rem;

        .secondary-color {
          border-color: $unnnic-color-aux-lemon;
          background: $unnnic-color-aux-lemon;
        }

        .username {
          flex: none;
        }

        .time {
          font-size: 0.875rem;
          color: $unnnic-color-brand-sec;
        }
      }

      .messages {
        & > * {
          font-size: 0.875rem;
          line-height: 1.375rem;
          color: $unnnic-color-neutral-dark;

          & + * {
            padding-top: 0.5rem;
          }
        }
      }
    }
  }
}
</style>
