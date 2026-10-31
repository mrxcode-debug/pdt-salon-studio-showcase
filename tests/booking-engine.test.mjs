import test from "node:test";
import assert from "node:assert/strict";
import { canTransition, parseTime, validateAppointment } from "../lib/booking-engine.mjs";

const existing = [
  {
    id: "a1",
    time: "10:00",
    startMinute: 600,
    duration: 60,
    customer: "Khách A",
    service: "Cắt",
    staff: "Lan",
    status: "confirmed",
    amount: 300000
  },
  {
    id: "a2",
    time: "11:30",
    startMinute: 690,
    duration: 60,
    customer: "Khách B",
    service: "Gội",
    staff: "Lan",
    status: "no_show",
    amount: 200000
  }
];

test("parseTime converts HH:MM to minutes", () => {
  assert.equal(parseTime("10:30"), 630);
});

test("booking transition rules reject skipping states", () => {
  assert.equal(canTransition("confirmed", "arrived"), true);
  assert.equal(canTransition("confirmed", "completed"), false);
});

test("same staff cannot be double-booked", () => {
  const candidate = {
    id: "new",
    time: "10:30",
    startMinute: 630,
    duration: 45,
    customer: "Khách C",
    service: "Gội",
    staff: "Lan",
    status: "confirmed",
    amount: 200000
  };
  const result = validateAppointment(existing, candidate);
  assert.equal(result.ok, false);
  assert.equal(result.code, "STAFF_OVERLAP");
});

test("inactive no-show slot does not block future appointment", () => {
  const candidate = {
    id: "new",
    time: "11:30",
    startMinute: 690,
    duration: 45,
    customer: "Khách C",
    service: "Gội",
    staff: "Lan",
    status: "confirmed",
    amount: 200000
  };
  const result = validateAppointment(existing, candidate);
  assert.deepEqual(result, { ok: true });
});

const validCandidate = Object.freeze({
  id: "time-boundary", time: "16:00", startMinute: 960, duration: 60,
  customer: "Khách kiểm thử", service: "Cắt", staff: "Lan", status: "confirmed", amount: 300000
});

test("time parser accepts exact minute boundaries", () => {
  for (const [time, minute] of [["00:00", 0], ["09:05", 545], ["12:00", 720], ["23:59", 1439]]) {
    assert.equal(parseTime(time), minute);
  }
});

test("time parser rejects incomplete, trailing, out-of-range and non-string inputs", () => {
  for (const time of ["", "10:", ":30", "9:05", "09:5", "10:30:00", "10:30:99", " 10:30", "10:30 ", "10:30\n", "24:00", "23:60", "-1:30", "xx:xx", null, undefined, 630]) {
    assert.throws(() => parseTime(time), { message: "INVALID_TIME" }, String(time));
  }
});

for (const startMinute of [NaN, Infinity, -Infinity, -1, 1440, 600.5]) {
  test(`invalid start minute ${startMinute} is rejected before conflict selection`, () => {
    assert.deepEqual(validateAppointment(existing, { ...validCandidate, startMinute }), { ok: false, code: "INVALID_TIME" });
  });
}

for (const duration of [NaN, Infinity, -Infinity, -1, 0, 0.5]) {
  test(`invalid duration ${duration} cannot bypass booking validation`, () => {
    assert.deepEqual(validateAppointment(existing, { ...validCandidate, duration }), { ok: false, code: "INVALID_DURATION" });
  });
}

test("displayed time must match the conflict-checked start minute", () => {
  for (const time of ["", "10:", "16:00:00", "10:30"]) {
    assert.deepEqual(validateAppointment(existing, { ...validCandidate, time }), { ok: false, code: "INVALID_TIME" });
  }
});

test("same-day finish at midnight is accepted but one minute later is rejected", () => {
  assert.deepEqual(validateAppointment(existing, { ...validCandidate, time: "23:00", startMinute: 1380 }), { ok: true });
  assert.deepEqual(validateAppointment(existing, { ...validCandidate, time: "23:01", startMinute: 1381 }), { ok: false, code: "OUTSIDE_BOOKING_DAY" });
  assert.deepEqual(validateAppointment(existing, { ...validCandidate, time: "00:00", startMinute: 0, duration: 1 }), { ok: true });
});

test("adjacent appointments, ignored current record and other staff still work", () => {
  assert.deepEqual(validateAppointment(existing, { ...validCandidate, time: "11:00", startMinute: 660, duration: 30 }), { ok: true });
  assert.deepEqual(validateAppointment(existing, { ...existing[0] }, "a1"), { ok: true });
  assert.deepEqual(validateAppointment(existing, { ...existing[0], id: "other", staff: "Hương" }), { ok: true });
  assert.deepEqual(validateAppointment(existing, { ...existing[0], id: "overlap" }), {
    ok: false, code: "STAFF_OVERLAP", conflictId: "a1", conflictCustomer: "Khách A", conflictTime: "10:00"
  });
});

test("invalid and valid checks preserve all source objects", () => {
  const input = Object.freeze(existing.map((item) => Object.freeze({ ...item })));
  const before = JSON.stringify(input);
  assert.deepEqual(validateAppointment(input, validCandidate), { ok: true });
  assert.deepEqual(validateAppointment(input, Object.freeze({ ...validCandidate, duration: Infinity })), { ok: false, code: "INVALID_DURATION" });
  assert.equal(JSON.stringify(input), before);
  assert.equal(validCandidate.startMinute, 960);
});
