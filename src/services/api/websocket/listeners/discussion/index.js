import create from './create';
import update from './update';
import discussionDelete from './delete';
import message from './message';

export default {
  create,
  update,
  delete: discussionDelete,
  message,
};
