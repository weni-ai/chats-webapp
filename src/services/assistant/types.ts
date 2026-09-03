export type AssistantDirection = 'human' | 'ai';

export type AssistantMessageType =
  | 'text'
  | 'audio'
  | 'image'
  | 'video'
  | 'file'
  | 'order';

export type ProductCarouselItem = {
  product_retailer_id: string;
  name: string;
  price: string | number;
  image: string;
  sale_price?: string | number;
  currency?: string;
  description?: string;
  seller_id?: string;
  product_url?: string;
};

export type CartProductItem = ProductCarouselItem & {
  quantity: number;
};

export type OrderProductItem = {
  product_retailer_id: string;
  name: string;
  price: string | number;
  sale_price?: string | number;
  currency?: string;
  image: string;
  description?: string;
  seller_id?: string;
  quantity: number;
};

export type AssistantMessage = {
  id: string;
  direction: AssistantDirection;
  type: AssistantMessageType;
  text: string;
  media?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  suggestion?: string;
  quickReplies: string[];
  status: string;
  timestamp: number;
  productCarousel?: {
    text: string;
    items: ProductCarouselItem[];
  };
};

export type AssistantQuickReply = string;
