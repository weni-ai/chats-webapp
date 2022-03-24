<template>
  <div id="app">
    <connect-layout>
      <router-view />
    </connect-layout>
  </div>
</template>

<script>
import ConnectLayout from './layouts/ConnectLayout';

export default {
  name: 'App',

  components: {
    ConnectLayout,
  },
};
</script>
