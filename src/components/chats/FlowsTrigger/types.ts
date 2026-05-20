export type MetaTemplateComponentType =
  | 'HEADER'
  | 'BODY'
  | 'FOOTER'
  | 'BUTTONS';

export type MetaTemplateHeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type MetaTemplateButtonType =
  | 'PHONE_NUMBER'
  | 'URL'
  | 'COPY_CODE'
  | 'FLOW'
  | 'QUICK_REPLY';

export interface MetaTemplateButton {
  type: MetaTemplateButtonType;
  text: string;
  url?: string;
  phone_number?: string;
}

export interface MetaTemplateComponent {
  type: MetaTemplateComponentType;
  format?: MetaTemplateHeaderFormat;
  text?: string;
  buttons?: MetaTemplateButton[];
  example?: {
    body_text?: string[][];
  };
}

export interface MetaTemplate {
  name?: string;
  parameter_format?: string;
  components?: MetaTemplateComponent[];
  language?: string;
  status?: string;
  category?: string;
  id?: string;
}

export interface FlowTemplate {
  variables: string[];
  data: MetaTemplate;
}

export interface FlowTemplatesResponse {
  flow_uuid: string;
  total_template_qty: number;
  templates: FlowTemplate[];
}

export interface TemplateBodySegment {
  type: 'text' | 'variable';
  text: string;
  filled?: boolean;
}
