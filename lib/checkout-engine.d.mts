export type ProductLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CheckoutInput = {
  checkoutId: string;
  appointmentId: string;
  staff: string;
  serviceAmount: number;
  commissionRate: number;
  productLines: ProductLine[];
  stockByProduct: Record<string, number>;
};

export function lineTotal(line: ProductLine): number;
export function finalizeCheckout(input: CheckoutInput):
  | {
      ok: true;
      checkout: {
        id: string;
        appointmentId: string;
        serviceAmount: number;
        productTotal: number;
        total: number;
        paidAmount: number;
        paymentState: "paid";
      };
      commission: {
        staff: string;
        amount: number;
        sourceAppointmentId: string;
        sourceCheckoutId: string;
      };
      inventoryMovements: Array<{
        productId: string;
        quantityDelta: number;
        reason: "checkout";
        traceId: string;
      }>;
    }
  | {
      ok: false;
      code: "INVALID_SERVICE_AMOUNT" | "INSUFFICIENT_STOCK";
      productId?: string;
      available?: number;
      requested?: number;
    };
