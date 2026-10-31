const terminalStatuses = new Set(["completed", "no_show", "cancelled"]);
const inactiveStatuses = new Set(["no_show", "cancelled"]);

const transitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["arrived", "no_show", "cancelled"],
  arrived: ["in_service", "cancelled"],
  in_service: ["completed"],
  completed: [],
  no_show: [],
  cancelled: []
};

export function parseTime(value) {
  // Time inputs are minute-precision HH:MM; reject partial/trailing values.
  if (typeof value !== "string" || value.length !== 5 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error("INVALID_TIME");
  }
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function formatTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

export function canTransition(from, to) {
  return Boolean(transitions[from]?.includes(to));
}

export function nextStatuses(status) {
  return transitions[status] ?? [];
}

export function isTerminal(status) {
  return terminalStatuses.has(status);
}

export function overlaps(aStart, aDuration, bStart, bDuration) {
  const aEnd = aStart + aDuration;
  const bEnd = bStart + bDuration;
  return aStart < bEnd && aEnd > bStart;
}

export function findStaffConflict(existing, candidate, ignoreId) {
  return existing.find((appointment) => {
    if (ignoreId && appointment.id === ignoreId) return false;
    if (appointment.staff !== candidate.staff) return false;
    if (inactiveStatuses.has(appointment.status)) return false;
    return overlaps(
      appointment.startMinute,
      appointment.duration,
      candidate.startMinute,
      candidate.duration
    );
  }) ?? null;
}

export function validateAppointment(existing, candidate, ignoreId) {
  if (!candidate.customer.trim()) return { ok: false, code: "CUSTOMER_REQUIRED" };
  if (!candidate.staff.trim()) return { ok: false, code: "STAFF_REQUIRED" };
  if (!candidate.service.trim()) return { ok: false, code: "SERVICE_REQUIRED" };
  if (!Number.isInteger(candidate.duration) || candidate.duration <= 0) {
    return { ok: false, code: "INVALID_DURATION" };
  }
  if (!Number.isInteger(candidate.startMinute) || candidate.startMinute < 0 || candidate.startMinute >= 1440) {
    return { ok: false, code: "INVALID_TIME" };
  }
  try {
    if (parseTime(candidate.time) !== candidate.startMinute) return { ok: false, code: "INVALID_TIME" };
  } catch {
    return { ok: false, code: "INVALID_TIME" };
  }
  // The pilot model has no booking date: do not silently wrap into tomorrow.
  if (candidate.startMinute + candidate.duration > 1440) {
    return { ok: false, code: "OUTSIDE_BOOKING_DAY" };
  }

  const conflict = findStaffConflict(existing, candidate, ignoreId);
  if (conflict) {
    return {
      ok: false,
      code: "STAFF_OVERLAP",
      conflictId: conflict.id,
      conflictCustomer: conflict.customer,
      conflictTime: conflict.time
    };
  }
  return { ok: true };
}
