import * as UnnnicSystem from '@weni/unnnic-system';

console.log('UnnnicSystem', UnnnicSystem);

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default {
  install(Vue) {
    Object.keys(UnnnicSystem).forEach((componentName) => {
      Vue.component(capitalize(componentName), UnnnicSystem[componentName]);
    });
  },
};
