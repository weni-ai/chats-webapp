import mime from 'mime';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';

export function getSupportedChatMediaFormats(type = 'all') {
  const mediaFormatsMap = {
    image: ['.png', '.jpeg', '.jpg', '.mp4'],
    doc: ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.csv'],
  };
  return mediaFormatsMap[type] || Object.values(mediaFormatsMap).flat();
}

/**
 * Sends media to specific active chat and provides progress feedback.
 * @param {File[]} payload.files - Array of files to be sent.
 * @param {string} payload.routeName - Name of the route to determine the type of request ('room' or 'discussion').
 * @param {Function} payload.progressCallback - Callback function to report progress.
 */
export async function sendMediaMessage({ files, routeName, progressCallback }) {
  try {
    const loadingFiles = {};
    const updateLoadingFiles = (messageUuid, progress) => {
      loadingFiles[messageUuid] = progress;
      const totalProgress =
        Object.values(loadingFiles).reduce((acc, value) => acc + value, 0) /
        Object.keys(loadingFiles).length;
      progressCallback(totalProgress);
    };

    const mediaPayload = {
      files,
      updateLoadingFiles,
    };

    if (routeName === 'discussion') {
      await useDiscussionMessages().sendDiscussionMedias(mediaPayload);
    } else {
      await useRoomMessages().sendRoomMedias(mediaPayload);
    }

    progressCallback(undefined);
  } catch (error) {
    console.error('Error while sending file message:', error);
    progressCallback(undefined);
  }
}

export function validateMediaFormat(files) {
  const formats = getSupportedChatMediaFormats().map((format) => format.trim());

  const isValid = Array.from(files).find((file) => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    const fileExtension = `.${fileName.split('.').pop()}`;

    const isValidFileExtension = formats.includes(fileExtension);
    const isValidFileType = fileType === mime.getType(fileName);

    return isValidFileExtension && isValidFileType;
  });

  return isValid;
}
