function validId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function lineTotal(line) {
  if (!line || typeof line !== "object") throw new Error("INVALID_PRODUCT_LINE");
  if (!validId(line.productId)) throw new Error("INVALID_PRODUCT_ID");
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error("INVALID_QUANTITY");
  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) throw new Error("INVALID_PRICE");
  return line.quantity * line.unitPrice;
}

export function finalizeCheckout(input) {
  if (!input || typeof input !== "object") return { ok: false, code: "INVALID_CHECKOUT_INPUT" };
  if (!validId(input.checkoutId)) return { ok: false, code: "INVALID_CHECKOUT_ID" };
  if (!validId(input.appointmentId)) return { ok: false, code: "INVALID_APPOINTMENT_ID" };
  if (!validId(input.staff)) return { ok: false, code: "INVALID_STAFF" };

  const serviceAmount = input.serviceAmount;
  if (!Number.isFinite(serviceAmount) || serviceAmount < 0) {
    return { ok: false, code: "INVALID_SERVICE_AMOUNT" };
  }
  if (!Number.isFinite(input.commissionRate) || input.commissionRate < 0 || input.commissionRate > 1) {
    return { ok: false, code: "INVALID_COMMISSION_RATE" };
  }
  if (!Array.isArray(input.productLines)) return { ok: false, code: "INVALID_PRODUCT_LINES" };
  if (!input.stockByProduct || typeof input.stockByProduct !== "object" || Array.isArray(input.stockByProduct)) {
    return { ok: false, code: "INVALID_STOCK_MAP" };
  }

  const inventoryMovements = [];
  const requestedByProduct = new Map();
  let productTotal = 0;

  for (const line of input.productLines) {
    let total;
    try {
      total = lineTotal(line);
    } catch (error) {
      return { ok: false, code: error instanceof Error ? error.message : "INVALID_PRODUCT_LINE" };
    }
    if (requestedByProduct.has(line.productId)) {
      return { ok: false, code: "DUPLICATE_PRODUCT_LINE", productId: line.productId };
    }

    const currentStock = input.stockByProduct[line.productId];
    if (!Number.isInteger(currentStock) || currentStock < 0) {
      return { ok: false, code: "INVALID_STOCK", productId: line.productId };
    }
    requestedByProduct.set(line.productId, line.quantity);
    if (line.quantity > currentStock) {
      return {
        ok: false,
        code: "INSUFFICIENT_STOCK",
        productId: line.productId,
        available: currentStock,
        requested: line.quantity
      };
    }

    productTotal += total;
    inventoryMovements.push({
      productId: line.productId,
      quantityDelta: -line.quantity,
      reason: "checkout",
      traceId: input.checkoutId
    });
  }

  const total = serviceAmount + productTotal;
  if (!Number.isSafeInteger(total)) return { ok: false, code: "INVALID_TOTAL" };
  const commission = Math.round(serviceAmount * input.commissionRate);
  if (!Number.isSafeInteger(commission) || commission < 0) return { ok: false, code: "INVALID_COMMISSION" };

  return {
    ok: true,
    checkout: {
      id: input.checkoutId,
      appointmentId: input.appointmentId,
      serviceAmount,
      productTotal,
      total,
      paidAmount: total,
      paymentState: "paid"
    },
    commission: {
      staff: input.staff,
      amount: commission,
      sourceAppointmentId: input.appointmentId,
      sourceCheckoutId: input.checkoutId
    },
    inventoryMovements
  };
}
