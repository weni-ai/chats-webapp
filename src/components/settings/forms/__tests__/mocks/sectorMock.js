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
