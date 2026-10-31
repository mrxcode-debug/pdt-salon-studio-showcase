"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Customer } from "../lib/demo-data";
import { money } from "../lib/demo-data";
import styles from "./customer-360.module.css";

const segmentLabel = {
  VIP: "VIP",
  Active: "Đang hoạt động",
  "At risk": "Cần giữ"
} as const;

export function Customer360({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState(customers[0]?.name ?? "");

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.lastService, customer.preference]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("vi").includes(needle))
    );
  }, [customers, query]);

  const selected = filtered.find((customer) => customer.name === selectedName) ?? filtered[0];
  const atRisk = customers.filter((customer) => customer.segment === "At risk").length;
  const vip = customers.filter((customer) => customer.segment === "VIP").length;
  const totalLifetime = customers.reduce((sum, customer) => sum + customer.lifetime, 0);

  return (
    <div className={styles.layout}>
      <section className={styles.summary} aria-label="Tổng quan khách hàng">
        <div><span>KHÁCH MẪU</span><strong>{customers.length}</strong><small>{vip} VIP · {atRisk} cần giữ</small></div>
        <div><span>GIÁ TRỊ KHÁCH</span><strong>{money(totalLifetime)}</strong><small>Lifetime trong demo</small></div>
        <div><span>TÍN HIỆU</span><strong>{customers.filter((item) => item.next).length}</strong><small>Khách có hành động tiếp theo</small></div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.directory}>
          <div className={styles.searchWrap}>
            <span>⌕</span>
            <input
              aria-label="Tìm khách hàng"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên, số điện thoại, dịch vụ..."
            />
            <b>{filtered.length}</b>
          </div>

          <div className={styles.list}>
            {filtered.map((customer) => (
              <button
                type="button"
                key={customer.name}
                className={selected?.name === customer.name ? styles.customerActive : styles.customer}
                onClick={() => setSelectedName(customer.name)}
              >
                <span className={styles.avatar}>{customer.name.slice(-1)}</span>
                <span className={styles.customerMain}>
                  <strong>{customer.name}</strong>
                  <small>{customer.phone} · {customer.visits} lần ghé</small>
                  <em>{customer.next}</em>
                </span>
                <span className={styles.customerSide}>
                  <i className={customer.segment === "At risk" ? styles.risk : styles.segment}>
                    {customer.segment ? segmentLabel[customer.segment] : "Khách"}
                  </i>
                  <b>{money(customer.lifetime)}</b>
                </span>
              </button>
            ))}
            {!filtered.length ? <div className={styles.empty}>Không tìm thấy khách phù hợp.</div> : null}
          </div>
        </section>

        {selected ? (
          <aside className={styles.profile} aria-label={"Customer 360 " + selected.name}>
            <div className={styles.profileTop}>
              <span className={styles.profileAvatar}>{selected.name.slice(-1)}</span>
              <div>
                <span className={styles.kicker}>CUSTOMER 360</span>
                <h2>{selected.name}</h2>
                <p>{selected.phone} · {selected.visits} lần ghé</p>
              </div>
            </div>

            <div className={styles.profileMetrics}>
              <div><span>Lifetime</span><strong>{money(selected.lifetime)}</strong></div>
              <div><span>Lần cuối</span><strong>{selected.lastVisit ?? "—"}</strong></div>
            </div>

            <div className={styles.nextAction}>
              <span>HÀNH ĐỘNG TIẾP THEO</span>
              <strong>{selected.next}</strong>
              <small>{selected.segment === "At risk" ? "Ưu tiên giữ khách trước khi mở khuyến mãi đại trà." : "Dựa trên lịch sử dịch vụ và nhịp quay lại."}</small>
            </div>

            <dl className={styles.details}>
              <div><dt>Dịch vụ gần nhất</dt><dd>{selected.lastService ?? "—"}</dd></div>
              <div><dt>Sở thích / lưu ý</dt><dd>{selected.preference ?? "Chưa có dữ liệu"}</dd></div>
              <div><dt>Ghi chú owner</dt><dd>{selected.ownerNote ?? "Chưa có ghi chú"}</dd></div>
            </dl>

            <div className={styles.actions}>
              <Link href={{ pathname: "/calendar", query: { customer: selected.name }, hash: "new-booking" }} prefetch={false}>Tạo lịch mới</Link>
              <Link href={{ pathname: "/retention", query: { customer: selected.name }, hash: "customer-care" }} prefetch={false}>Chăm sóc khách</Link>
            </div>
            <small className={styles.demoNote}>Thao tác demo · chưa gửi tin và chưa lưu dữ liệu thật.</small>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
