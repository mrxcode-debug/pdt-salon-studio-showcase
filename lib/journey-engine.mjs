function addDays(isoDate, days) {
  const date = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function completeCustomerVisit(input) {
  const { customer, appointment, checkout, completedAt, rebookAfterDays = 45 } = input;

  if (!["in_service", "completed"].includes(appointment.status)) {
    return { ok: false, code: "APPOINTMENT_NOT_SERVICEABLE" };
  }
  if (appointment.customer !== customer.name) {
    return { ok: false, code: "CUSTOMER_MISMATCH" };
  }
  if (checkout.appointmentId !== appointment.id || checkout.paymentState !== "paid") {
    return { ok: false, code: "CHECKOUT_NOT_TRACEABLE" };
  }

  const dueDate = addDays(completedAt, rebookAfterDays);
  const updatedCustomer = {
    ...customer,
    visits: customer.visits + 1,
    lifetime: customer.lifetime + checkout.total,
    next: "Tái đặt trước " + dueDate
  };

  return {
    ok: true,
    customer: updatedCustomer,
    historyEntry: {
      appointmentId: appointment.id,
      completedAt,
      service: appointment.service,
      staff: appointment.staff,
      total: checkout.total
    },
    rebookCandidate: {
      customer: customer.name,
      sourceAppointmentId: appointment.id,
      dueDate,
      rebookAfterDays
    }
  };
}
