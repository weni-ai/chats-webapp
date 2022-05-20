<template>
  <header>
    <div class="search">
      <unnnic-input
        class="input"
        icon-left="search-1"
        placeholder="Busque por chats ativos e encerrados..."
        size="sm"
      />
      <unnnic-select v-model="select" class="select" size="sm">
        <option v-for="option in options" :key="option.value" :selected="select === option.value">
          {{ option.text }}
        </option>
      </unnnic-select>
    </div>

    <div class="info">
      <unnnic-icon icon="vip-crown-queen-2" scheme="feedback-yellow" />
      <unnnic-icon icon="alarm-bell-3" />
      <unnnic-icon icon="alert-circle-1" />

      <img
        class="avatar"
        src="https://avataaars.io/?avatarStyle=Circle&topType=WinterHat2&accessoriesType=Kurt&hatColor=PastelBlue&facialHairType=BeardMajestic&facialHairColor=Blonde&clotheType=GraphicShirt&clotheColor=PastelBlue&graphicType=Diamond&eyeType=Default&eyebrowType=RaisedExcitedNatural&mouthType=Twinkle&skinColor=Pale"
        alt="User avatar"
      />
    </div>
  </header>
</template>

<script>
import { unnnicInput, unnnicSelect, unnnicIcon } from '@weni/unnnic-system';

export default {
  components: {
    unnnicIcon,
    unnnicInput,
    unnnicSelect,
  },

  data: () => ({
    select: 1,
    options: [
      {
        text: '',
        value: null,
      },
      {
        text: 'ilhasoft',
        value: 1,
      },
    ],
  }),
};
</script>

<style lang="scss" scoped>
header {
  display: flex;
  align-items: center;
  gap: 2rem;

  padding-right: 1.5rem;
  background: $unnnic-color-background-sky;

  .search {
    flex: 1;
    display: flex;
    gap: 1rem;

    .input {
      flex-basis: 80%;
    }

    .select {
      flex-basis: 20%;
    }
  }

  .info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;

    .avatar {
      height: 2.5rem;
      width: 2.5rem;
      border-radius: 50%;
    }
  }
}
</style>
