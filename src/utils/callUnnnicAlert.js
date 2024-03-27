import { unnnicCallAlert } from '@weni/unnnic-system';

export default (props) => {
  const mobileMainElement = document.querySelector('.mobile-home__main');

  unnnicCallAlert({
    ...props,
    containerRef: mobileMainElement,
  });
};
