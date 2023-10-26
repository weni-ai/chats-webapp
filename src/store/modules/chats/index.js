import rooms from './rooms';
import roomMessages from './roomMessages';
import quickMessages from './quickMessages';
import quickMessagesShared from './quickMessagesShared';
import discussions from './discussions';

const module = {
  namespaced: true,
  modules: {
    rooms,
    roomMessages,
    quickMessages,
    quickMessagesShared,
    discussions,
  },
};

export default module;
