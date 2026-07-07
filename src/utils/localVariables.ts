export const CONTACT_NAME_TOKEN = '{{contact.name}}';
export const CONTACT_URN_TOKEN = '{{contact.urn}}';
export const AGENT_NAME_TOKEN = '{{agent.name}}';
export const AGENT_EMAIL_TOKEN = '{{agent.email}}';

export type LocalVariableToken =
  | typeof CONTACT_NAME_TOKEN
  | typeof CONTACT_URN_TOKEN
  | typeof AGENT_NAME_TOKEN
  | typeof AGENT_EMAIL_TOKEN;

export interface LocalVariableContact {
  uuid?: string;
  external_id?: string;
  name?: string;
  urns?: Array<{ scheme?: string; path?: string } | string> | string[];
  urn?: string;
  phone?: string;
}

export interface LocalVariableAgent {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface LocalVariableRoom {
  contact?: {
    urn?: string;
    urns?: Array<{ scheme?: string; path?: string } | string>;
  };
  urn?: string;
}

export interface LocalVariable {
  token: LocalVariableToken;
  labelKey: string;
  previewValue: string;
}

export interface ResolveContext {
  contact?: LocalVariableContact;
  agent?: LocalVariableAgent;
  room?: LocalVariableRoom;
}

export interface AvailabilityContext {
  contacts: LocalVariableContact[];
  agent?: LocalVariableAgent;
  room?: LocalVariableRoom;
}

const trimmedOrEmpty = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const getContactName = (
  contact: LocalVariableContact | undefined,
): string => trimmedOrEmpty(contact?.name);

const extractUrnPath = (
  urn: { scheme?: string; path?: string } | string | undefined,
): string => {
  if (!urn) return '';
  if (typeof urn === 'string') {
    const [, path] = urn.split(':');
    return trimmedOrEmpty(path ?? urn);
  }
  return trimmedOrEmpty(urn.path);
};

export const getContactUrn = (
  contact: LocalVariableContact | undefined,
  room?: LocalVariableRoom,
): string => {
  if (!contact && !room) return '';

  const directUrn =
    trimmedOrEmpty(contact?.urn) || trimmedOrEmpty(contact?.phone);
  if (directUrn) return extractUrnPath(directUrn) || directUrn;

  const firstUrn = contact?.urns?.[0];
  const fromUrns = extractUrnPath(firstUrn as any);
  if (fromUrns) return fromUrns;

  const roomFirst = room?.contact?.urns?.[0];
  const roomDirect =
    trimmedOrEmpty(room?.contact?.urn) || trimmedOrEmpty(room?.urn);
  return extractUrnPath(roomFirst as any) || extractUrnPath(roomDirect);
};

export const getAgentName = (agent: LocalVariableAgent | undefined): string => {
  const composed = `${trimmedOrEmpty(agent?.first_name)} ${trimmedOrEmpty(
    agent?.last_name,
  )}`.trim();
  return composed || trimmedOrEmpty(agent?.email);
};

export const getAgentEmail = (agent: LocalVariableAgent | undefined): string =>
  trimmedOrEmpty(agent?.email);

export const getAvailableLocalVariables = ({
  contacts,
  agent,
  room,
}: AvailabilityContext): LocalVariable[] => {
  const safeContacts = contacts?.length ? contacts : [];

  const everyContactHas = (predicate: (_c: LocalVariableContact) => string) =>
    safeContacts.length > 0 &&
    safeContacts.every((contact) => predicate(contact).length > 0);

  const previewContact = safeContacts[0];

  const available: LocalVariable[] = [];

  if (everyContactHas(getContactName)) {
    available.push({
      token: CONTACT_NAME_TOKEN,
      labelKey: 'flows_trigger.variable_mapping.local_variables.contact_name',
      previewValue: getContactName(previewContact),
    });
  }

  if (everyContactHas((c) => getContactUrn(c, room))) {
    available.push({
      token: CONTACT_URN_TOKEN,
      labelKey: 'flows_trigger.variable_mapping.local_variables.contact_urn',
      previewValue: getContactUrn(previewContact, room),
    });
  }

  const agentName = getAgentName(agent);
  if (agentName) {
    available.push({
      token: AGENT_NAME_TOKEN,
      labelKey: 'flows_trigger.variable_mapping.local_variables.agent_name',
      previewValue: agentName,
    });
  }

  const agentEmail = getAgentEmail(agent);
  if (agentEmail) {
    available.push({
      token: AGENT_EMAIL_TOKEN,
      labelKey: 'flows_trigger.variable_mapping.local_variables.agent_email',
      previewValue: agentEmail,
    });
  }

  return available;
};

const TOKEN_RESOLVERS: Record<
  LocalVariableToken,
  (_ctx: ResolveContext) => string
> = {
  [CONTACT_NAME_TOKEN]: ({ contact }) => getContactName(contact),
  [CONTACT_URN_TOKEN]: ({ contact, room }) => getContactUrn(contact, room),
  [AGENT_NAME_TOKEN]: ({ agent }) => getAgentName(agent),
  [AGENT_EMAIL_TOKEN]: ({ agent }) => getAgentEmail(agent),
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export const resolveLocalVariablesInValue = (
  value: string,
  ctx: ResolveContext,
): string => {
  if (!value) return '';

  let result = value;
  (Object.keys(TOKEN_RESOLVERS) as LocalVariableToken[]).forEach((token) => {
    if (!result.includes(token)) return;
    const replacement = TOKEN_RESOLVERS[token](ctx);
    result = result.replace(new RegExp(escapeRegExp(token), 'g'), replacement);
  });

  return result;
};

export const resolveAllValues = (
  params: Record<string, string>,
  ctx: ResolveContext,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      resolveLocalVariablesInValue(value ?? '', ctx),
    ]),
  );
