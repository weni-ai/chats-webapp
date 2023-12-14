import listenerRoom from './room';
import listenerDiscussion from './discussion';
import listenerStatus from './status';

export default ({ ws, app }) => {
  ws.on('msg.create', (message) =>
    listenerRoom.message.create({
      message,
      store: app.$store,
      route: app.$route,
      me: app.me,
    }),
  );

  ws.on('discussion_msg.create', (message) =>
    listenerDiscussion.message.create({
      message,
      store: app.$store,
      route: app.$route,
      me: app.me,
    }),
  );

  ws.on('rooms.create', (room) =>
    listenerRoom.create({
      room,
      store: app.$store,
      me: app.me,
    }),
  );

  ws.on('discussions.create', (discussion) =>
    listenerDiscussion.create({
      discussion,
      store: app.$store,
      me: app.me,
    }),
  );

  ws.on('rooms.update', (room) =>
    listenerRoom.update({
      room,
      store: app.$store,
      router: app.$router,
      me: app.me,
      viewedAgent: app.viewedAgent,
    }),
  );

  ws.on('discussions.update', (discussion) =>
    listenerDiscussion.update({
      discussion,
      store: app.$store,
      me: app.me,
    }),
  );

  ws.on('rooms.close', (room) =>
    listenerRoom.delete({
      room,
      store: app.$store,
    }),
  );

  ws.on('discussions.close', (discussion) =>
    listenerDiscussion.delete({
      discussion,
      store: app.$store,
      route: app.$route,
    }),
  );

  ws.on('msg.update', (message) =>
    listenerRoom.message.update({
      message,
      store: app.$store,
      me: app.me,
    }),
  );

  ws.on('status.update', (content) => listenerStatus.update({ content, app: this }));
};
