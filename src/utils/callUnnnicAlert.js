import { unnnicCallAlert } from '@weni/unnnic-system';

export default (props) => {
  const mobileMainElement = document.querySelector('.home-mobile__main');

  unnnicCallAlert({
    ...props,
    containerRef: mobileMainElement,
  });
};
