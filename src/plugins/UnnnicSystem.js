import UnnnicSystem from '@weni/unnnic-system';

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const { install: unnnicInstall, ...exportedComponents } = UnnnicSystem;

export default {
  install(app, options) {
    unnnicInstall.call(UnnnicSystem, app, options);

    Object.keys(exportedComponents).forEach((componentName) => {
      app.component(
        capitalize(componentName),
        exportedComponents[componentName],
      );
    });
  },
};
