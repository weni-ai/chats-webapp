import getEnv from './env';
import { PREFERENCES_NILO } from '../components/PreferencesBar.vue';

function setNiloDisplay(value) {
  const botButton = document.querySelector('#wwc');

  if (botButton) {
    botButton.style.display = value;
  }
}

// eslint-disable-next-line func-names
(function (d, s, u) {
  const h = d.getElementsByTagName(s)[0];
  const k = d.createElement(s);
  // eslint-disable-next-line func-names
  k.onload = function () {
    const l = d.createElement(s);
    l.src = u;
    l.async = true;
    h.parentNode.insertBefore(l, k.nextSibling);
    l.onload = () => {
      if ((localStorage.getItem(PREFERENCES_NILO) || 'yes') === 'no') {
        setNiloDisplay('none');
      }
    };
  };
  k.async = true;
  k.src = 'https://storage.googleapis.com/push-webchat/wwc-latest.js';
  h.parentNode.insertBefore(k, h);
})(document, 'script', getEnv('BOT_URL'));

window.addEventListener('hideBottomRightOptions', () => {
  setNiloDisplay('none');
});

window.addEventListener('showBottomRightOptions', () => {
  setNiloDisplay(null);
});
