import Link from "next/link";
import { ContactQueueAction, RetentionContactQueue } from "../../components/retention-contact-queue";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { customers, money, noShowQueue, rebookCustomers } from "../../lib/demo-data";
import { rankRetentionTasks, scoreRetentionTask } from "../../lib/retention-engine.mjs";
import styles from "./retention.module.css";

const priorityLabel = { HIGH: "Ưu tiên cao", MEDIUM: "Ưu tiên", LOW: "Theo dõi" } as const;

export default async function RetentionPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawCustomer = (await searchParams)?.customer;
  // A link opens context only; it does not save contact tasks or send messages.
  const matches = typeof rawCustomer === "string" ? customers.filter((customer) => customer.name === rawCustomer) : [];
  const selectedCustomer = matches.length === 1 ? matches[0] : undefined;
  const rebook = rankRetentionTasks(rebookCustomers);
  const noShows = rankRetentionTasks(noShowQueue.map((item) => ({ ...item, noShow: true })));
  const highPriority = [...rebook, ...noShows].filter((item) => item.retention.priority === "HIGH").length;
  const totalValue = noShowQueue.reduce((sum, item) => sum + item.amount, 0);

  const contactCandidates = [
    ...rebook.map((customer) => ({ id: "rebook:" + customer.name, name: customer.name, service: customer.service, source: "Tái đặt" })),
    ...noShows.map((item) => ({ id: "no-show:" + item.name, name: item.name, service: item.service, source: "Không đến" }))
  ];

  return (
    <Shell>
      <PageHeader
        eyebrow="GIỮ KHÁCH"
        title="Tái đặt & no-show"
        description="Ưu tiên khách cần chăm lại, chọn danh sách liên hệ và theo dõi thao tác trong phiên demo."
      />

      {rawCustomer !== undefined && !selectedCustomer ? (
        <p role="alert">Liên kết khách không hợp lệ trong dữ liệu mẫu. <Link href="/customers">Chọn lại khách</Link>.</p>
      ) : null}
      {selectedCustomer ? (
        <section id="customer-care" className={styles.panel} aria-label="Chăm sóc khách đã chọn">
          <div className={styles.heading}>
            <div><span>KHÁCH ĐÃ CHỌN</span><h2>{selectedCustomer.name}</h2></div>
            <Link href="/customers">Chọn khách khác</Link>
          </div>
          <p><strong>{selectedCustomer.next}</strong></p>
          <p>Dịch vụ gần nhất: {selectedCustomer.lastService ?? "Chưa có dữ liệu"}</p>
          <p>Lưu ý: {selectedCustomer.preference ?? "Chưa có dữ liệu"}</p>
          <p>{selectedCustomer.ownerNote ?? "Chưa có ghi chú"}</p>
          <Link className="primary-button" href={{ pathname: "/calendar", query: { customer: selectedCustomer.name }, hash: "new-booking" }} prefetch={false}>Tạo lịch quay lại</Link>
          <p className={styles.guard}>Hồ sơ mẫu · chưa thêm vào hàng liên hệ và chưa gửi tin.</p>
        </section>
      ) : null}

      <section className={styles.summary}>
        <div><span>CẦN XỬ LÝ</span><strong>{rebook.length + noShows.length}</strong><small>{highPriority} ưu tiên cao</small></div>
        <div><span>GIÁ TRỊ NO-SHOW</span><strong>{money(totalValue)}</strong><small>Doanh thu có nguy cơ mất</small></div>
        <div><span>TÁI ĐẶT</span><strong>{rebook.length}</strong><small>Khách đến chu kỳ quay lại</small></div>
      </section>

      <RetentionContactQueue candidates={contactCandidates}>
      <div className={styles.board}>
        <section className={styles.panel}>
          <div className={styles.heading}>
            <div><span>TÁI ĐẶT</span><h2>Khách đến hạn quay lại</h2></div>
            <small>Xếp theo số ngày kể từ lần ghé gần nhất.</small>
          </div>
          <div className={styles.queue}>
            {rebook.map((customer) => (
              <article className={styles.task} key={customer.name}>
                <div className={styles.rank}>
                  <b>{customer.retention.score}</b>
                  <span className={styles[customer.retention.priority.toLowerCase()]}>{priorityLabel[customer.retention.priority]}</span>
                </div>
                <div className={styles.main}>
                  <strong>{customer.name}</strong>
                  <span>{customer.service}</span>
                  <small>Lần cuối {customer.lastVisit} · {customer.days} ngày</small>
                </div>
                <div className={styles.action}>
                  <strong>{customer.days >= 45 ? "Nên liên hệ" : "Theo dõi"}</strong>
                  <ContactQueueAction candidateId={"rebook:" + customer.name} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.heading}>
            <div><span>NO-SHOW</span><h2>Cần xử lý hôm nay</h2></div>
            <small>Ưu tiên theo no-show + giá trị lịch.</small>
          </div>
          <div className={styles.queue}>
            {noShows.map((item) => {
              const signal = scoreRetentionTask({ noShow: true, amount: item.amount });
              return (
                <article className={styles.task} key={item.name}>
                  <div className={styles.rank}>
                    <b>{signal.score}</b>
                    <span className={styles[signal.priority.toLowerCase()]}>{priorityLabel[signal.priority]}</span>
                  </div>
                  <div className={styles.main}>
                    <strong>{item.name}</strong>
                    <span>{item.time} · {item.service}</span>
                    <small>Stylist {item.staff} · {money(item.amount)}</small>
                  </div>
                  <div className={styles.action}>
                    <strong>{signal.priority === "HIGH" ? "Giữ ngay hôm nay" : "Liên hệ lại"}</strong>
                    <ContactQueueAction candidateId={"no-show:" + item.name} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
      </RetentionContactQueue>

      <div className={styles.guard}>Không gửi SMS/Zalo trong pilot · đây là queue/readiness deterministic, không phải marketing automation thật.</div>
    </Shell>
  );
}
