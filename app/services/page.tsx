import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { money, services, staff } from "../../lib/demo-data";
import styles from "./services.module.css";

export default function ServicesPage() {
  const totalRevenue = staff.reduce((sum, person) => sum + person.revenue, 0);
  const totalCommission = staff.reduce((sum, person) => sum + person.commission, 0);
  const nearlyFull = staff.filter((person) => person.booked / person.capacity >= 0.85).length;

  return (
    <Shell>
      <PageHeader
        eyebrow="DANH MỤC"
        title="Dịch vụ & năng lực"
        description="Owner thấy ngay ai đang gần đầy tải, dịch vụ nào phụ thuộc một người và hoa hồng có truy vết."
      />

      <section className={styles.summary}>
        <div><span>DOANH THU NHÂN SỰ</span><strong>{money(totalRevenue)}</strong><small>Từ lịch demo hôm nay</small></div>
        <div><span>HOA HỒNG TẠM TÍNH</span><strong>{money(totalCommission)}</strong><small>{Math.round(totalCommission / totalRevenue * 100)}% doanh thu</small></div>
        <div><span>ÁP LỰC LỊCH</span><strong>{nearlyFull}</strong><small>Stylist từ 85% công suất</small></div>
      </section>

      <section className={styles.staffPanel}>
        <div className={styles.sectionHead}>
          <div><span>NHÂN SỰ</span><h2>Công suất & hoa hồng</h2></div>
          <small>Commission luôn bám vào doanh thu hoàn tất trong engine checkout.</small>
        </div>
        <div className={styles.staffGrid}>
          {staff.map((person) => {
            const utilization = Math.round(person.booked / person.capacity * 100);
            const commissionRate = person.revenue ? Math.round(person.commission / person.revenue * 100) : 0;
            const state = utilization >= 85 ? "GẦN ĐẦY" : utilization <= 65 ? "CÒN TẢI" : "ỔN ĐỊNH";
            return (
              <article className={styles.staffCard} key={person.name}>
                <div className={styles.staffTop}>
                  <div className={styles.avatar}>{person.name.slice(0, 1)}</div>
                  <div><strong>{person.name}</strong><span>{person.role}</span></div>
                  <b className={utilization >= 85 ? styles.hot : styles.state}>{state}</b>
                </div>
                <div className={styles.loadRow}><span>Công suất</span><strong>{person.booked}/{person.capacity} · {utilization}%</strong></div>
                <div className={styles.bar}><i style={{ width: utilization + "%" }} /></div>
                <div className={styles.moneyGrid}>
                  <div><span>Doanh thu</span><strong>{money(person.revenue)}</strong></div>
                  <div><span>Hoa hồng</span><strong>{money(person.commission)}</strong><small>{commissionRate}%</small></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <div><span>DỊCH VỤ</span><h2>Năng lực thực hiện</h2></div>
          <small>Dịch vụ chỉ có 1 stylist được đánh dấu phụ thuộc nhân sự.</small>
        </div>
        <div className={styles.serviceGrid}>
          {services.map((service) => {
            const capableStaff = service.staff.split(",").map((item) => item.trim()).filter(Boolean);
            const singlePoint = capableStaff.length === 1;
            return (
              <article className={styles.serviceCard} key={service.name}>
                <div className={styles.serviceTop}>
                  <span>{service.duration} PHÚT</span>
                  {singlePoint ? <b>PHỤ THUỘC 1 NGƯỜI</b> : <b className={styles.covered}>CÓ DỰ PHÒNG</b>}
                </div>
                <h2>{service.name}</h2>
                <div className={styles.price}>{money(service.price)}</div>
                <div className={styles.capability}>
                  <span>Thực hiện</span>
                  <strong>{capableStaff.join(" · ")}</strong>
                </div>
                <small>{singlePoint ? "Owner nên tránh xếp kín stylist duy nhất cho dịch vụ này." : "Có thể chuyển tải giữa stylist khi lịch dày."}</small>
              </article>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
