import Link from "next/link";
import { Shell } from "../components/shell";
import { Card, Metric, PageHeader } from "../components/ui";
import { appointments, demoSalon, inventory, money, ownerAlerts, paymentQueue, rebookCustomers, staff, statusLabel } from "../lib/demo-data";

export default function DashboardPage() {
  const completion = Math.round((demoSalon.metrics.completed / demoSalon.metrics.bookings) * 100);
  const target = Math.round((demoSalon.metrics.revenue / demoSalon.metrics.target) * 100);
  const activeAppointments = appointments.filter((item) => ["arrived", "in_service", "confirmed", "pending"].includes(item.status));
  const nextAppointment = activeAppointments[0];
  const stockRisk = inventory.filter((item) => item.stock <= item.threshold).length;
  const exceptionCount = demoSalon.metrics.unconfirmed + demoSalon.metrics.noShow + paymentQueue.length + stockRisk;

  const decisionCards = [
    { label: "Cần thu", value: money(demoSalon.metrics.unpaidAmount), note: paymentQueue.length + " khoản đang mở", href: "/checkout", tone: "danger" },
    { label: "Lịch cần chốt", value: String(demoSalon.metrics.unconfirmed), note: "2 lịch trong 90 phút", href: "/calendar", tone: "warning" },
    { label: "Khách cần giữ", value: String(demoSalon.metrics.rebook + demoSalon.metrics.noShow), note: "Tái đặt + no-show", href: "/retention", tone: "accent" },
    { label: "Kho cần chú ý", value: String(stockRisk), note: "Mặt hàng dưới ngưỡng", href: "/inventory", tone: "" }
  ];

  return (
    <Shell>
      <PageHeader
        eyebrow="BẢNG ĐIỀU HÀNH"
        title="Tổng quan hôm nay"
        description={demoSalon.name + " · " + demoSalon.today}
        action={<Link className="primary-button" href="/calendar">Mở lịch hôm nay</Link>}
      />

      <section className="owner-command-strip" aria-label="Việc owner cần chốt">
        <div className="owner-command-head">
          <div>
            <span className="eyebrow">HÔM NAY CẦN CHỐT</span>
            <h2>{exceptionCount} tín hiệu cần owner chú ý</h2>
          </div>
          <div className="owner-now">
            <span>Tiếp theo</span>
            <strong>{nextAppointment ? nextAppointment.time + " · " + nextAppointment.customer : "Không còn lịch"}</strong>
          </div>
        </div>
        <div className="decision-grid">
          {decisionCards.map((item) => (
            <Link className={"decision-card " + item.tone} href={item.href} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
              <b>→</b>
            </Link>
          ))}
        </div>
      </section>

      <div className="metrics-grid">
        <Metric label="Lịch hôm nay" value={String(demoSalon.metrics.bookings)} note={String(completion) + "% đã hoàn tất"} />
        <Metric label="Doanh thu" value={money(demoSalon.metrics.revenue)} note={String(target) + "% mục tiêu ngày"} tone="accent" />
        <Metric label="Chưa thu" value={money(demoSalon.metrics.unpaidAmount)} note="2 lịch cần chốt thanh toán" tone="warning" />
        <Metric label="Chưa xác nhận" value={String(demoSalon.metrics.unconfirmed)} note="2 lịch trong 90 phút tới" tone="warning" />
        <Metric label="No-show" value={String(demoSalon.metrics.noShow)} note="Cần xử lý lại hôm nay" />
        <Metric label="Cần tái đặt" value={String(demoSalon.metrics.rebook)} note="Khách 45–60 ngày chưa quay lại" />
      </div>

      <div className="dashboard-grid owner-priority-grid">
        <Card>
          <div className="section-heading"><div><span className="eyebrow">ƯU TIÊN</span><h2>Owner cần xử lý</h2></div><span className="section-count">{ownerAlerts.length} việc</span></div>
          <div className="alert-list">
            {ownerAlerts.map((alert, index) => (
              <Link href={alert.href} className="alert-row" key={alert.title}>
                <span className="priority-index">{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{alert.title}</strong><span>{alert.detail}</span></div><b>→</b>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-heading"><div><span className="eyebrow">NHÂN SỰ</span><h2>Công suất hôm nay</h2></div><Link href="/services">Chi tiết</Link></div>
          <div className="staff-list">
            {staff.map((person) => {
              const pct = Math.round((person.booked / person.capacity) * 100);
              const state = pct >= 85 ? "Gần đầy" : pct <= 65 ? "Còn tải" : "Ổn định";
              return (
                <div className="staff-row" key={person.name}>
                  <div className="avatar">{person.name.slice(0, 1)}</div>
                  <div className="staff-main">
                    <div><strong>{person.name}</strong><span>{person.role}</span></div>
                    <div className="bar"><i style={{ width: String(pct) + "%" }} /></div>
                    <small>{person.booked}/{person.capacity} khung · {pct}% · {state}</small>
                  </div>
                  <span className="commission">{money(person.commission)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <div className="section-heading">
            <div><span className="eyebrow">CHƯA THU</span><h2>Cần chốt thanh toán</h2></div>
            <Link href="/checkout">Mở checkout</Link>
          </div>
          <div className="customer-list">
            {paymentQueue.map((item) => (
              <article className="customer-row" key={item.name}>
                <div className="avatar">{item.name.slice(-1)}</div>
                <div className="customer-main">
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="customer-value">
                  <span>Chưa thu</span>
                  <strong>{money(item.amount)}</strong>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-heading">
            <div><span className="eyebrow">GIỮ KHÁCH</span><h2>Ưu tiên tái đặt lịch</h2></div>
            <Link href="/retention">Mở hàng xử lý</Link>
          </div>
          <div className="rebook-grid">
            {rebookCustomers.slice(0, 2).map((customer) => (
              <div className="rebook-card" key={customer.name}>
                <strong>{customer.name}</strong>
                <span>{customer.service}</span>
                <small>Lần cuối {customer.lastVisit} · {customer.days} ngày</small>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="section-heading">
          <div><span className="eyebrow">LỊCH HẸN</span><h2>Đang diễn ra</h2></div>
          <Link href="/calendar">Xem toàn bộ</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Giờ</th><th>Khách</th><th>Dịch vụ</th><th>Stylist</th><th>Trạng thái</th><th>Giá trị</th></tr></thead>
            <tbody>
              {appointments.slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td>{item.time}</td><td><strong>{item.customer}</strong></td><td>{item.service}</td><td>{item.staff}</td>
                  <td><span className={"status " + item.status}>{statusLabel(item.status)}</span></td><td>{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
