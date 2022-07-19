const sendMessageWhenRouteChanges = async () => {
  window.parent.postMessage(
    {
      event: 'changePathname',
      pathname: window.location.pathname,
    },
    '*',
  );
};

export default [sendMessageWhenRouteChanges];
