import { api } from "../lib/api";

export interface OrderResponse {
  paymentId: string;
  orderId:   string;
  amount:    number;
  currency:  string;
  keyId:     string;
  plan:      string;
  discount?: number;
}

export interface SubscriptionRecord {
  id:        string;
  plan:      string;
  startDate: string;
  endDate:   string;
  isActive:  boolean;
}

export const paymentService = {
  async createOrder(plan: string, seriesId?: string, couponCode?: string): Promise<OrderResponse> {
    return api.post<OrderResponse>("/payments/create-order", { plan, seriesId, couponCode });
  },

  async verifyPayment(data: {
    razorpay_order_id:   string;
    razorpay_payment_id: string;
    razorpay_signature:  string;
    paymentId:           string;
    plan:                string;
  }): Promise<SubscriptionRecord> {
    return api.post<SubscriptionRecord>("/payments/verify", data);
  },

  async getMySubscriptions(): Promise<SubscriptionRecord[]> {
    return api.get<SubscriptionRecord[]>("/payments/my-subscriptions");
  },
};

/** Open the Razorpay checkout widget */
export function openRazorpayCheckout(order: OrderResponse, onSuccess: (data: any) => void, onDismiss?: () => void) {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => {
    const rzp = new (window as any).Razorpay({
      key:         order.keyId,
      amount:      order.amount,
      currency:    order.currency,
      order_id:    order.orderId,
      name:        "MPSC Sadhak",
      description: `${order.plan.charAt(0).toUpperCase() + order.plan.slice(1)} Plan`,
      image:       "",
      theme:       { color: "#7c3aed" },
      handler:     onSuccess,
      modal:       { ondismiss: onDismiss },
    });
    rzp.open();
  };
  document.body.appendChild(script);
}
