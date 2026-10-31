import Link from "next/link";
import { BookingBoard } from "../../components/booking-board";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { appointments, customers } from "../../lib/demo-data";

export default async function CalendarPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawCustomer = (await searchParams)?.customer;
  // Only existing, unambiguous synthetic records may supply a prefill.
  const matches = typeof rawCustomer === "string" ? customers.filter((customer) => customer.name === rawCustomer) : [];
  const selectedCustomer = matches.length === 1 ? matches[0] : undefined;

  return (
    <Shell>
      <PageHeader
        eyebrow="VẬN HÀNH"
        title="Lịch hẹn hôm nay"
        description="Tạo lịch nhanh, chặn trùng stylist và chỉ cho phép trạng thái hợp lệ."
      />
      {rawCustomer !== undefined && !selectedCustomer ? (
        <p role="alert">Liên kết khách không hợp lệ trong dữ liệu mẫu. <Link href="/customers">Chọn lại khách</Link>.</p>
      ) : null}
      <BookingBoard
        key={selectedCustomer?.name ?? "unselected"}
        initialAppointments={appointments}
        initialCustomer={selectedCustomer?.name}
      />
    </Shell>
  );
}
