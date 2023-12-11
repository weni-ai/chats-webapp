// TODO: import everything necessary for the function to work
export default async (message) => {
  const { rooms, activeRoom } = this.$store.state.chats.rooms;
  const findRoom = rooms.find((room) => room.uuid === message.room);

  this.$store.dispatch('chats/rooms/bringRoomFront', findRoom);
  if (findRoom) {
    if (this.me.email === message.user?.email) {
      return;
    }

    const notification = new SoundNotification('ping-bing');
    notification.notify();

    if (document.hidden) {
      sendWindowNotification({
        title: message.contact.name,
        message: message.text,
        image: message.media?.[0]?.url,
      });
    }

    const isCurrentRoom = this.$route.name === 'room' && this.$route.params.roomId === message.room;
    const isViewModeCurrentRoom =
      this.$route.params.viewedAgent && activeRoom?.uuid === message.room;

    if (isCurrentRoom || isViewModeCurrentRoom) {
      this.$store.dispatch('chats/roomMessages/addMessage', message);
    }

    if (this.isAJson(message.text)) return;

    this.$store.dispatch('chats/rooms/addNewMessagesByRoom', {
      room: message.room,
      message: {
        created_on: message.created_on,
        uuid: message.uuid,
        text: message.text,
      },
    });
  }
};
