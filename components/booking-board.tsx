"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Appointment, AppointmentStatus } from "../lib/demo-data";
import { money, services, staff, statusLabel } from "../lib/demo-data";
import { canTransition, nextStatuses, parseTime, validateAppointment } from "../lib/booking-engine.mjs";
import styles from "./booking-board.module.css";

const actionLabel: Partial<Record<AppointmentStatus, string>> = {
  confirmed: "Xác nhận",
  arrived: "Đã đến",
  in_service: "Bắt đầu",
  completed: "Hoàn tất",
  no_show: "Không đến",
  cancelled: "Hủy"
};

type DraftBooking = {
  customer: string;
  time: string;
  staff: string;
  service: string;
};

function endTime(startMinute: number, duration: number) {
  const total = startMinute + duration;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

export function BookingBoard({ initialAppointments, initialCustomer = "" }: { initialAppointments: Appointment[]; initialCustomer?: string }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [notice, setNotice] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [draft, setDraft] = useState<DraftBooking>({
    customer: initialCustomer,
    time: "12:00",
    staff: staff[0]?.name ?? "",
    service: services[0]?.name ?? ""
  });

  const selectedService = useMemo(
    () => services.find((service) => service.name === draft.service),
    [draft.service]
  );

  const capableStaff = selectedService?.staff.split(",").map((name) => name.trim()).filter(Boolean) ?? [];
  const staffIsCapable = staff.some((person) => person.name === draft.staff && capableStaff.includes(person.name));
  const bookingStaffError = staffIsCapable ? "" : selectedService
    ? `${draft.staff || "Nhân sự đã chọn"} không thực hiện ${selectedService.name}. Chọn nhân sự phù hợp.`
    : "Chọn dịch vụ hợp lệ trước khi chọn nhân sự.";

  const draftStartMinute = useMemo(() => {
    try {
      return parseTime(draft.time);
    } catch {
      return null;
    }
  }, [draft.time]);
  const bookingTimeError = draftStartMinute === null
    ? "Chọn giờ hợp lệ theo định dạng HH:MM để xem khung dự kiến."
    : selectedService && draftStartMinute + selectedService.duration > 1440
      ? "Dịch vụ vượt sang ngày hôm sau. Chọn giờ sớm hơn; bản demo chỉ xếp lịch trong ngày."
      : "";

  const visibleAppointments = useMemo(
    () => appointments.filter((item) => staffFilter === "all" || item.staff === staffFilter),
    [appointments, staffFilter]
  );

  const staffLoad = useMemo(
    () => staff.map((person) => {
      const active = appointments.filter(
        (item) => item.staff === person.name && !["cancelled", "no_show"].includes(item.status)
      );
      const bookedMinutes = active.reduce((total, item) => total + item.duration, 0);
      return {
        name: person.name,
        count: active.length,
        bookedMinutes,
        load: Math.min(100, Math.round((person.booked / person.capacity) * 100))
      };
    }),
    [appointments]
  );

  function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService || !staffIsCapable) {
      setNotice(bookingStaffError);
      return;
    }
    if (draftStartMinute === null || bookingTimeError) {
      setNotice(bookingTimeError);
      return;
    }

    const candidate: Appointment = {
      id: "local-" + String(appointments.length + 1),
      time: draft.time,
      startMinute: draftStartMinute,
      duration: selectedService.duration,
      customer: draft.customer.trim(),
      service: selectedService.name,
      staff: draft.staff,
      status: "confirmed",
      amount: selectedService.price
    };

    const result = validateAppointment(appointments, candidate);
    if (!result.ok) {
      if (result.code === "STAFF_OVERLAP") {
        setNotice("Không thể đặt: " + draft.staff + " đang có lịch " + String(result.conflictTime ?? "") + " với " + String(result.conflictCustomer ?? "khách khác") + ".");
      } else if (result.code === "INVALID_TIME" || result.code === "OUTSIDE_BOOKING_DAY") {
        setNotice("Chưa thể tạo lịch. Kiểm tra giờ bắt đầu và thời lượng trong ngày.");
      } else {
        setNotice("Chưa thể tạo lịch. Vui lòng điền đủ thông tin.");
      }
      return;
    }

    setAppointments((current) =>
      [...current, candidate].sort((a, b) => a.startMinute - b.startMinute)
    );
    setStaffFilter(draft.staff);
    setDraft((current) => ({ ...current, customer: "" }));
    setNotice("Đã thêm lịch mẫu. Chưa lưu dữ liệu thật. " + draft.staff + " · " + draft.time + "–" + endTime(candidate.startMinute, candidate.duration) + ".");
  }

  function moveStatus(id: string, nextStatus: AppointmentStatus) {
    setAppointments((current) =>
      current.map((item) => {
        if (item.id !== id || !canTransition(item.status, nextStatus)) return item;
        return { ...item, status: nextStatus };
      })
    );
    setNotice("Đã cập nhật trạng thái trong phiên demo.");
  }

  return (
    <div className={styles.board}>
      <section className={styles.commandBar} aria-label="Tải lịch theo nhân sự">
        <div className={styles.commandCopy}>
          <span>NHỊP LỊCH HÔM NAY</span>
          <strong>{appointments.length} lịch · {staffLoad.reduce((sum, item) => sum + item.bookedMinutes, 0)} phút dịch vụ</strong>
        </div>
        <div className={styles.staffLoad}>
          {staffLoad.map((person) => (
            <button
              type="button"
              key={person.name}
              className={staffFilter === person.name ? styles.staffChipActive : styles.staffChip}
              onClick={() => setStaffFilter(person.name)}
            >
              <span>{person.name}</span>
              <strong>{person.count} lịch · {person.load}%</strong>
            </button>
          ))}
          <button
            type="button"
            className={staffFilter === "all" ? styles.staffChipActive : styles.staffChip}
            onClick={() => setStaffFilter("all")}
          >
            <span>Tất cả</span>
            <strong>{appointments.length} lịch</strong>
          </button>
        </div>
      </section>

      <form id="new-booking" aria-label="Tạo lịch nhanh" className={styles.form} onSubmit={addBooking}>
        {initialCustomer ? <p className={styles.notice}>Đã chọn khách từ hồ sơ mẫu. Kiểm tra dịch vụ, nhân sự và giờ trước khi thêm lịch.</p> : null}
        <div className={styles.formHeader}>
          <div>
            <span>TẠO LỊCH NHANH</span>
            <strong>Chọn dịch vụ, thấy ngay thời lượng và khung kết thúc</strong>
          </div>
          <button type="submit" disabled={Boolean(bookingTimeError) || !staffIsCapable || !selectedService}>+ Thêm lịch</button>
        </div>

        <div className={styles.fields}>
          <label>
            Khách hàng
            <input
              value={draft.customer}
              onChange={(event) => setDraft((current) => ({ ...current, customer: event.target.value }))}
              placeholder="Tên khách"
            />
          </label>
          <label>
            Giờ
            <input
              type="time"
              step={60}
              value={draft.time}
              aria-invalid={Boolean(bookingTimeError)}
              aria-describedby={bookingTimeError ? "booking-time-feedback" : undefined}
              onChange={(event) => {
                setDraft((current) => ({ ...current, time: event.target.value }));
                setNotice("");
              }}
            />
          </label>
          <label>
            Nhân sự
            <select
              aria-label="Nhân sự"
              value={draft.staff}
              aria-invalid={!staffIsCapable}
              aria-describedby={bookingStaffError ? "booking-staff-feedback" : undefined}
              onChange={(event) => {
                setDraft((current) => ({ ...current, staff: event.target.value }));
                setNotice("");
              }}
            >
              {staff.map((person) => <option key={person.name} value={person.name} disabled={!capableStaff.includes(person.name)}>{person.name}</option>)}
            </select>
          </label>
          <label>
            Dịch vụ
            <select
              aria-label="Dịch vụ"
              value={draft.service}
              onChange={(event) => {
                setDraft((current) => ({ ...current, service: event.target.value }));
                setNotice("");
              }}
            >
              {services.map((service) => <option key={service.name}>{service.name}</option>)}
            </select>
          </label>
        </div>

        {bookingStaffError ? <p id="booking-staff-feedback" className={styles.notice} role="status">{bookingStaffError}</p> : null}
        {bookingTimeError ? <p id="booking-time-feedback" className={styles.notice} role="status">{bookingTimeError}</p> : null}
        {selectedService && draftStartMinute !== null && !bookingTimeError ? (
          <div className={styles.bookingPreview}>
            <span>Khung dự kiến</span>
            <strong>{draft.time}–{endTime(draftStartMinute, selectedService.duration)}</strong>
            <small>{selectedService.duration} phút · {money(selectedService.price)} · {draft.staff}</small>
          </div>
        ) : null}

        {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
      </form>

      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <div>
            <span>LỊCH ĐANG HIỂN THỊ</span>
            <strong>{staffFilter === "all" ? "Tất cả nhân sự" : staffFilter}</strong>
          </div>
          <b>{visibleAppointments.length} lịch</b>
        </div>
        {visibleAppointments.length ? visibleAppointments.map((item) => {
          const actions = nextStatuses(item.status);
          return (
            <article className={styles.appointment} key={item.id}>
              <div className={styles.time}>
                <strong>{item.time}</strong>
                <small>{endTime(item.startMinute, item.duration)}</small>
              </div>
              <div className={styles.main}>
                <div className={styles.topline}>
                  <strong>{item.customer}</strong>
                  <span className={"status " + item.status}>{statusLabel(item.status)}</span>
                </div>
                <div>{item.service} · <b>{item.staff}</b></div>
                <small>{item.duration} phút · {money(item.amount)}</small>
                {actions.length > 0 ? (
                  <div className={styles.actions}>
                    {actions.map((nextStatus) => (
                      <button
                        type="button"
                        key={nextStatus}
                        onClick={() => moveStatus(item.id, nextStatus)}
                      >
                        {actionLabel[nextStatus] ?? statusLabel(nextStatus)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        }) : <div className={styles.emptyState}>Không có lịch trong bộ lọc này.</div>}
      </div>
    </div>
  );
}
