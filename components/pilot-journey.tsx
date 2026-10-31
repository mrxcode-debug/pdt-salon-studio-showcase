"use client";

import { useState } from "react";
import type { Appointment, AppointmentStatus, Customer } from "../lib/demo-data";
import { money, statusLabel } from "../lib/demo-data";
import { canTransition } from "../lib/booking-engine.mjs";
import { finalizeCheckout } from "../lib/checkout-engine.mjs";
import { completeCustomerVisit } from "../lib/journey-engine.mjs";

function displayDate(value: string) {
  const [year, month, day] = value.split("-");
  return day + "/" + month + "/" + year;
}

export function PilotJourney({ appointment, customer }: { appointment: Appointment; customer: Customer }) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [checkout, setCheckout] = useState<ReturnType<typeof finalizeCheckout> | null>(null);
  const [journey, setJourney] = useState<ReturnType<typeof completeCustomerVisit> | null>(null);

  function move(next: AppointmentStatus) {
    if (canTransition(status, next)) setStatus(next);
  }

  function payAndComplete() {
    if (status !== "in_service") return;

    const result = finalizeCheckout({
      checkoutId: "pilot-flow-checkout",
      appointmentId: appointment.id,
      staff: appointment.staff,
      serviceAmount: appointment.amount,
      commissionRate: 0.15,
      productLines: [],
      stockByProduct: {}
    });

    setCheckout(result);
    if (!result.ok) return;

    const visit = completeCustomerVisit({
      customer,
      appointment: { ...appointment, status: "in_service" },
      checkout: result.checkout,
      completedAt: "2026-09-21",
      rebookAfterDays: 45
    });

    setJourney(visit);
    if (visit.ok) setStatus("completed");
  }

  return (
    <section className="card" data-testid="pilot-journey">
      <div className="section-heading">
        <div>
          <span className="eyebrow">END-TO-END PILOT</span>
          <h2>{customer.name}</h2>
        </div>
        <span className={"status " + status}>{statusLabel(status)}</span>
      </div>

      <div className="customer-list">
        <div className="customer-row">
          <div className="avatar">{appointment.staff.slice(0, 1)}</div>
          <div className="customer-main">
            <strong>{appointment.service}</strong>
            <span>{appointment.time} · Stylist {appointment.staff}</span>
            <small>{appointment.duration} phút</small>
          </div>
          <div className="customer-value">
            <span>Giá trị</span>
            <strong>{money(appointment.amount)}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {status === "confirmed" ? (
          <button className="primary-button" type="button" onClick={() => move("arrived")}>Khách đã đến</button>
        ) : null}
        {status === "arrived" ? (
          <button className="primary-button" type="button" onClick={() => move("in_service")}>Bắt đầu dịch vụ</button>
        ) : null}
        {status === "in_service" ? (
          <button className="primary-button" type="button" onClick={payAndComplete}>Thanh toán & hoàn tất</button>
        ) : null}
      </div>

      {checkout?.ok && journey?.ok ? (
        <div style={{ marginTop: 16 }}>
          <div className="alert-row">
            <div><strong>Thanh toán</strong><span>Đã thu đủ</span></div>
            <b>{money(checkout.checkout.paidAmount)}</b>
          </div>
          <div className="alert-row">
            <div><strong>Lịch sử khách</strong><span>Đã ghi nhận dịch vụ hoàn tất</span></div>
            <b>{journey.customer.visits} lần ghé</b>
          </div>
          <div className="alert-row">
            <div><strong>Tái đặt</strong><span>Tín hiệu giữ khách tiếp theo</span></div>
            <b>{displayDate(journey.rebookCandidate.dueDate)}</b>
          </div>
        </div>
      ) : null}
    </section>
  );
}
