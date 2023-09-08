import mime from 'mime-types';

export default {
  namespaced: true,
  state: {
    acceptedFileExtensions: [
      '.png',
      '.jpeg',
      '.jpg',
      '.mp4',
      '.pdf',
      '.doc',
      '.docx',
      '.txt',
      '.xls',
      '.xlsx',
      '.csv',
    ],
  },

  getters: {
    getAcceptedFileExtensions({ acceptedFileExtensions }) {
      return acceptedFileExtensions;
    },
    validFile(files) {
      if (files.length > this.maximumUploads) return [];

      return Array.from(files).filter((file) => {
        if (this.validExtension([file])) {
          return true;
        }
        return false;
      });
    },

    validExtension(files) {
      const formats = this.supportedFormats.map((format) => format.trim());

      const isValid = Array.from(files).find((file) => {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        const fileExtension = `.${fileName.split('.').pop()}`;

        const isValidFileExtension = formats.includes(fileExtension);
        const isValidFileType = fileType === mime.lookup(fileName);

        return isValidFileExtension && isValidFileType;
      });

      return isValid;
    },
  },
};
