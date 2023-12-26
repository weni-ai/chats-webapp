import roomListener from './room';
import discussionListener from './discussion';
import statusListener from './status';

export default ({ ws, app }) => {
  const createListener = (callback) => (payload) => {
    callback(payload, {
      app,
    });
  };

  ws.on('rooms.create', createListener(roomListener.create));
  ws.on('rooms.update', createListener(roomListener.update));
  ws.on('rooms.close', createListener(roomListener.delete));
  ws.on('msg.create', createListener(roomListener.message.create));
  ws.on('msg.update', createListener(roomListener.message.update)); // Used when sending media in the room

  ws.on('discussion_msg.create', createListener(discussionListener.message.create));
  ws.on('discussions.create', createListener(discussionListener.create));
  ws.on('discussions.update', createListener(discussionListener.update));
  ws.on('discussions.close', createListener(discussionListener.delete));

  ws.on('status.update', createListener(statusListener.update));
};
