import test from "node:test";
import assert from "node:assert/strict";
import { finalizeCheckout } from "../lib/checkout-engine.mjs";

function validInput(overrides = {}) {
  return {
    checkoutId: "c1",
    appointmentId: "a2",
    staff: "Vy",
    serviceAmount: 1650000,
    commissionRate: 0.15,
    productLines: [{ productId: "p1", quantity: 1, unitPrice: 650000 }],
    stockByProduct: { p1: 2 },
    ...overrides
  };
}

test("checkout creates traceable commission and stock movement without mutating input", () => {
  const input = validInput();
  const snapshot = structuredClone(input);
  const result = finalizeCheckout(input);
  assert.equal(result.ok, true);
  assert.equal(result.checkout.total, 2300000);
  assert.equal(result.commission.amount, 247500);
  assert.equal(result.commission.sourceAppointmentId, "a2");
  assert.deepEqual(result.inventoryMovements, [
    { productId: "p1", quantityDelta: -1, reason: "checkout", traceId: "c1" }
  ]);
  assert.deepEqual(input, snapshot);
});

test("checkout rejects inventory underflow", () => {
  const result = finalizeCheckout(validInput({
    checkoutId: "c2",
    productLines: [{ productId: "p1", quantity: 3, unitPrice: 650000 }]
  }));
  assert.equal(result.ok, false);
  assert.equal(result.code, "INSUFFICIENT_STOCK");
  assert.equal(result.available, 2);
});

test("checkout rejects malformed identity and commission inputs", () => {
  for (const [overrides, code] of [
    [{ checkoutId: "" }, "INVALID_CHECKOUT_ID"],
    [{ appointmentId: " " }, "INVALID_APPOINTMENT_ID"],
    [{ staff: "" }, "INVALID_STAFF"],
    [{ commissionRate: Number.NaN }, "INVALID_COMMISSION_RATE"],
    [{ commissionRate: -0.01 }, "INVALID_COMMISSION_RATE"],
    [{ commissionRate: 1.01 }, "INVALID_COMMISSION_RATE"]
  ]) {
    assert.equal(finalizeCheckout(validInput(overrides)).code, code);
  }
});

test("checkout rejects malformed product collections and stock", () => {
  assert.equal(finalizeCheckout(validInput({ productLines: null })).code, "INVALID_PRODUCT_LINES");
  assert.equal(finalizeCheckout(validInput({ stockByProduct: null })).code, "INVALID_STOCK_MAP");
  assert.equal(finalizeCheckout(validInput({ stockByProduct: { p1: Number.NaN } })).code, "INVALID_STOCK");
  assert.equal(finalizeCheckout(validInput({ stockByProduct: { p1: -1 } })).code, "INVALID_STOCK");
});

test("duplicate product lines cannot collectively overdraw one stock snapshot", () => {
  const result = finalizeCheckout(validInput({
    productLines: [
      { productId: "p1", quantity: 1, unitPrice: 650000 },
      { productId: "p1", quantity: 1, unitPrice: 650000 }
    ],
    stockByProduct: { p1: 1 }
  }));
  assert.equal(result.ok, false);
  assert.equal(result.code, "DUPLICATE_PRODUCT_LINE");
  assert.equal(result.productId, "p1");
});

test("invalid product line values fail closed", () => {
  for (const [line, code] of [
    [{ productId: "", quantity: 1, unitPrice: 1 }, "INVALID_PRODUCT_ID"],
    [{ productId: "p1", quantity: 0, unitPrice: 1 }, "INVALID_QUANTITY"],
    [{ productId: "p1", quantity: 1.5, unitPrice: 1 }, "INVALID_QUANTITY"],
    [{ productId: "p1", quantity: 1, unitPrice: Number.NaN }, "INVALID_PRICE"],
    [{ productId: "p1", quantity: 1, unitPrice: -1 }, "INVALID_PRICE"]
  ]) {
    assert.equal(finalizeCheckout(validInput({ productLines: [line] })).code, code);
  }
});
