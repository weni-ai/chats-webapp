import unnnic from '@weni/unnnic-system';

export default (props) => {
  const mobileMainElement = document.querySelector('.mobile-home__main');

  unnnic.unnnicCallAlert({
    ...props,
    containerRef: mobileMainElement,
  });
};
