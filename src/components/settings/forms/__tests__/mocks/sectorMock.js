const defaultProps = {
  value: {
    uuid: '',
    name: '',
    can_trigger_flows: false,
    can_edit_custom_fields: false,
    managers: [],
    workingDay: {
      start: '',
      end: '',
    },
    config: {
      can_input_context: false,
      completion_context: '',
      can_use_bulk_transfer: false,
      can_use_chat_completion: false,
    },
    agents: [],
    queue: {
      uuid: '',
    },
    tags: [],
    maxSimultaneousChatsByAgent: '',
  },
  managers: [],
};

export default defaultProps;
