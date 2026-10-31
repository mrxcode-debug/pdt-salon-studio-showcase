import type { Appointment, Customer } from "./demo-data";

type PaidCheckout = {
  appointmentId: string;
  total: number;
  paymentState: "paid";
};

export type CompletedVisitResult =
  | {
      ok: true;
      customer: Customer;
      historyEntry: {
        appointmentId: string;
        completedAt: string;
        service: string;
        staff: string;
        total: number;
      };
      rebookCandidate: {
        customer: string;
        sourceAppointmentId: string;
        dueDate: string;
        rebookAfterDays: number;
      };
    }
  | {
      ok: false;
      code: "APPOINTMENT_NOT_SERVICEABLE" | "CUSTOMER_MISMATCH" | "CHECKOUT_NOT_TRACEABLE";
    };

export function completeCustomerVisit(input: {
  customer: Customer;
  appointment: Appointment;
  checkout: PaidCheckout;
  completedAt: string;
  rebookAfterDays?: number;
}): CompletedVisitResult;
