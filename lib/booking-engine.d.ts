import type { Appointment, AppointmentStatus } from "./demo-data";

export type BookingValidation =
  | { ok: true }
  | {
      ok: false;
      code: "CUSTOMER_REQUIRED" | "STAFF_REQUIRED" | "SERVICE_REQUIRED" | "INVALID_DURATION" | "INVALID_TIME" | "OUTSIDE_BOOKING_DAY" | "STAFF_OVERLAP";
      conflictId?: string;
      conflictCustomer?: string;
      conflictTime?: string;
    };

export function parseTime(value: string): number;
export function formatTime(totalMinutes: number): string;
export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean;
export function nextStatuses(status: AppointmentStatus): AppointmentStatus[];
export function isTerminal(status: AppointmentStatus): boolean;
export function overlaps(aStart: number, aDuration: number, bStart: number, bDuration: number): boolean;
export function findStaffConflict(existing: Appointment[], candidate: Appointment, ignoreId?: string): Appointment | null;
export function validateAppointment(existing: Appointment[], candidate: Appointment, ignoreId?: string): BookingValidation;
