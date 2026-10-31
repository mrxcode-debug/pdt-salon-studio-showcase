"use client";

import { useMemo, useState } from "react";
import type { Appointment, Customer } from "../lib/demo-data";
import { money } from "../lib/demo-data";
import { finalizeCheckout } from "../lib/checkout-engine.mjs";
import { completeCustomerVisit } from "../lib/journey-engine.mjs";
import styles from "./checkout-panel.module.css";

const product = {
  id: "p1",
  name: "Olaplex No.3",
  unitPrice: 650000,
  stock: 2
};

function displayDate(value: string) {
  const [year, month, day] = value.split("-");
  return day + "/" + month + "/" + year;
}

export function CheckoutPanel({ appointment, customer }: { appointment: Appointment; customer: Customer }) {
  const [includeProduct, setIncludeProduct] = useState(true);
  const [result, setResult] = useState<ReturnType<typeof finalizeCheckout> | null>(null);
  const [journey, setJourney] = useState<ReturnType<typeof completeCustomerVisit> | null>(null);
  const finalized = result?.ok === true;

  const previewTotal = useMemo(
    () => appointment.amount + (includeProduct ? product.unitPrice : 0),
    [appointment.amount, includeProduct]
  );

  function finalize() {
    if (finalized) return;
    const checkout = finalizeCheckout({
      checkoutId: "demo-checkout-1",
      appointmentId: appointment.id,
      staff: appointment.staff,
      serviceAmount: appointment.amount,
      commissionRate: 0.15,
      productLines: includeProduct
        ? [{ productId: product.id, quantity: 1, unitPrice: product.unitPrice }]
        : [],
      stockByProduct: { [product.id]: product.stock }
    });

    setResult(checkout);
    if (checkout.ok) {
      setJourney(completeCustomerVisit({
        customer,
        appointment,
        checkout: checkout.checkout,
        completedAt: "2026-09-21",
        rebookAfterDays: 45
      }));
    } else {
      setJourney(null);
    }
  }

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>APPOINTMENT</span>
        <h2>{appointment.customer}</h2>
        <div className={styles.row}><span>Dịch vụ</span><strong>{appointment.service}</strong></div>
        <div className={styles.row}><span>Stylist</span><strong>{appointment.staff}</strong></div>
        <div className={styles.row}><span>Tiền dịch vụ</span><strong>{money(appointment.amount)}</strong></div>

        <label className={styles.product}>
          <input
            type="checkbox"
            checked={includeProduct}
            onChange={(event) => {
              setIncludeProduct(event.target.checked);
              setResult(null);
              setJourney(null);
            }}
          />
          <div>
            <strong>+ {product.name}</strong>
            <span>{money(product.unitPrice)} · tồn {product.stock} chai</span>
          </div>
        </label>

        <div className={styles.total}>
          <span>Tổng thanh toán</span>
          <strong>{money(previewTotal)}</strong>
        </div>
        <button className={styles.primary} type="button" onClick={finalize} disabled={finalized}>
          {finalized ? "Đã chốt trong phiên demo" : "Chốt thanh toán mẫu"}
        </button>
      </section>

      <section className={styles.card}>
        <span className={styles.eyebrow}>DETERMINISTIC OUTPUT</span>
        <h2>Kết quả sau checkout</h2>
        {!result ? (
          <p className={styles.muted}>Chưa chốt. Dữ liệu chỉ thay đổi trong phiên demo.</p>
        ) : result.ok ? (
          <div className={styles.result}>
            <div className={styles.success}>✓ Thanh toán hợp lệ</div>
            <div className={styles.row}><span>Paid</span><strong>{money(result.checkout.paidAmount)}</strong></div>
            <div className={styles.row}><span>Hoa hồng {appointment.staff}</span><strong>{money(result.commission.amount)}</strong></div>
            <div className={styles.row}><span>Trace appointment</span><code>{result.commission.sourceAppointmentId}</code></div>
            {result.inventoryMovements.map((movement) => (
              <div className={styles.row} key={movement.productId}>
                <span>Kho {product.name}</span>
                <strong>{movement.quantityDelta} chai</strong>
              </div>
            ))}
            {journey?.ok ? (
              <>
                <div className={styles.row}><span>Lịch sử khách</span><strong>{journey.customer.visits} lần ghé</strong></div>
                <div className={styles.row}><span>Lifetime mới</span><strong>{money(journey.customer.lifetime)}</strong></div>
                <div className={styles.row}><span>Tái đặt trước</span><strong>{displayDate(journey.rebookCandidate.dueDate)}</strong></div>
              </>
            ) : null}
          </div>
        ) : (
          <div className={styles.error}>Không thể checkout: {result.code}</div>
        )}
      </section>
    </div>
  );
}
