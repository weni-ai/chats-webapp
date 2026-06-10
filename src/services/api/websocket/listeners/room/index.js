import create from './create';
import inactivity from './inactivity';
import roomDelete from './delete';
import update from './update';
import message from './message';
import roomInternalNote from './internalNote';

export default {
  create,
  delete: roomDelete,
  update,
  message,
  roomInternalNote,
  inactivity,
};
