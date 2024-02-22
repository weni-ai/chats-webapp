// eslint-disable-next-line import/prefer-default-export
export async function sendFileMessage({ files, routeName, storeDispatch }) {
  try {
    const loadingFiles = {};
    const updateLoadingFiles = (messageUuid, progress) => {
      loadingFiles[messageUuid] = progress;
      return (
        Object.values(loadingFiles).reduce((acc, value) => acc + value, 0) /
        Object.keys(loadingFiles).length
      );
    };
    const actionType =
      routeName === 'discussion'
        ? 'chats/discussionMessages/sendDiscussionMedias'
        : 'chats/roomMessages/sendRoomMedias';

    await storeDispatch(actionType, {
      files,
      updateLoadingFiles,
    });
    return undefined;
  } catch (e) {
    console.error('Uploading some files may not have completed');
    return undefined;
  }
}
