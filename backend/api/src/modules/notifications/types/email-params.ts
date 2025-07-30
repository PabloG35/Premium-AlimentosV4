/** 1) Correo de registro */
export interface RegistrationParams {
  customerName: string;
}

/** 2) Correo de nueva orden */
export interface OrderPlacedParams {
  customerName: string;
  orderCode: string;
  orderDate: string;
  shippingAddress?: string; // ← opcional
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discountAmount?: number;
  shippingCost?: number;
  total: number;
  paymentMethod?: string;
  orderLink: string;
}

/** 3) Correo de actualización de estatus de orden */
export interface OrderStatusUpdateParams {
  customerName: string;
  orderCode: string;
  newStatus: string;
  statusDate: string;
  trackingUrl?: string;
}

/** 4 & 5) Solicitud de review (inicial y recordatorio) */
export interface ReviewRequestParams {
  customerName: string;
  orderCode: string;
  products: {
    name: string;
    productUrl: string;
    reviewUrl: string;
  }[];
  thankYouNote?: string;
}

export interface PaymentStatusParams {
  customerName:   string;
  orderCode:      string;
  paymentStatus:  string;
  amount:         number;
  transactionId?: string;
  orderLink:      string;
}
