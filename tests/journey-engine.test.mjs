import test from "node:test";
import assert from "node:assert/strict";
import { completeCustomerVisit } from "../lib/journey-engine.mjs";

const appointment = {
  id: "a2",
  time: "09:30",
  startMinute: 570,
  duration: 180,
  customer: "Trần Thu Hà",
  service: "Nhuộm Balayage",
  staff: "Vy",
  status: "in_service",
  amount: 1650000
};

const customer = {
  name: "Trần Thu Hà",
  phone: "09•• ••• 744",
  visits: 8,
  lifetime: 12680000,
  next: "Đang phục vụ hôm nay"
};

test("completed paid visit updates customer history and rebook signal", () => {
  const result = completeCustomerVisit({
    customer,
    appointment,
    checkout: {
      appointmentId: "a2",
      total: 2300000,
      paymentState: "paid"
    },
    completedAt: "2026-09-21",
    rebookAfterDays: 45
  });

  assert.equal(result.ok, true);
  assert.equal(result.customer.visits, 9);
  assert.equal(result.customer.lifetime, 14980000);
  assert.equal(result.historyEntry.appointmentId, "a2");
  assert.equal(result.historyEntry.total, 2300000);
  assert.equal(result.rebookCandidate.dueDate, "2026-11-05");
});

test("customer mismatch cannot mutate visit history", () => {
  const result = completeCustomerVisit({
    customer: { ...customer, name: "Khách khác" },
    appointment,
    checkout: {
      appointmentId: "a2",
      total: 2300000,
      paymentState: "paid"
    },
    completedAt: "2026-09-21"
  });

  assert.deepEqual(result, { ok: false, code: "CUSTOMER_MISMATCH" });
});
