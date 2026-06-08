// Shiprocket API request/response types
// Reference: https://apidocs.shiprocket.in/

export interface ShiprocketAuthResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
  token: string;
}

export interface ShiprocketPickupLocation {
  id: number;
  pickup_location: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  phone: string;
  email: string;
  name: string;
}

export interface ShiprocketPickupLocationsResponse {
  data: {
    shipping_address: ShiprocketPickupLocation[];
  };
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
}

export interface ShiprocketCreateOrderPayload {
  order_id: string;
  order_date: string; // YYYY-MM-DD HH:mm
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

export interface ShiprocketServiceabilityCourier {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  freight_charge: number;
  cod_charges: number;
  etd: string; // "Jul 12, 2024" style
  estimated_delivery_days: string;
  is_surface: boolean;
  is_hyperlocal: boolean;
}

export interface ShiprocketServiceabilityResponse {
  status: number;
  data: {
    available_courier_companies: ShiprocketServiceabilityCourier[];
    recommended_courier_company_id?: number;
    is_recommendation_enabled?: number;
    shiprocket_recommended_courier_id?: number;
    cheapest_courier_id?: number;
  };
}

export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
}

export interface ShiprocketTrackingData {
  awb_code: string;
  courier_name?: string;
  current_status?: string;
  shipment_status?: number;
  shipment_track?: Array<{
    awb_code: string;
    courier_name: string;
    current_status: string;
    edd?: string;
    delivered_date?: string;
  }>;
  shipment_track_activities?: ShiprocketTrackingActivity[];
  track_url?: string;
  etd?: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: ShiprocketTrackingData;
}

export interface ShiprocketWebhookPayload {
  awb: string;
  current_status: string;
  current_status_id?: number;
  current_timestamp?: string;
  order_id?: string | number; // our source order id (we send order._id)
  sr_order_id?: string | number; // Shiprocket's own order id
  shipment_status?: string;
  shipment_status_id?: number;
  courier_name?: string;
  etd?: string;
  scans?: Array<{
    date: string;
    activity: string;
    location: string;
    status?: string;
  }>;
}

export class ShiprocketError extends Error {
  code: string;
  httpStatus: number;
  details?: unknown;

  constructor(
    code: string,
    message: string,
    httpStatus = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "ShiprocketError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export interface NormalizedTracking {
  awb?: string;
  courierName?: string;
  status: string;
  expectedDelivery?: Date;
  trackUrl?: string;
  history: Array<{
    date: string;
    status?: string;
    activity: string;
    location: string;
  }>;
}
