"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import styles from "./retention-contact-queue.module.css";

type ContactCandidate = Readonly<{ id: string; name: string; service: string; source: string }>;
type ContactEntry = Readonly<{ candidateId: string; contacted: boolean }>;
type ContactContextValue = {
  candidates: readonly ContactCandidate[];
  entries: readonly ContactEntry[];
  add: (candidateId: string) => void;
};

const ContactContext = createContext<ContactContextValue | null>(null);

export function ContactQueueAction({ candidateId }: { candidateId: string }) {
  const context = useContext(ContactContext);
  if (!context) throw new Error("CONTACT_QUEUE_PROVIDER_REQUIRED");
  const candidate = context.candidates.find((item) => item.id === candidateId);
  const selected = context.entries.some((entry) => entry.candidateId === candidateId);
  return (
    <button
      type="button"
      className={styles.control}
      disabled={!candidate || selected}
      aria-controls="contact-shortlist"
      aria-describedby="contact-shortlist-note"
      onClick={() => context.add(candidateId)}
    >
      {selected ? "Đã chọn liên hệ" : "Đưa vào hàng liên hệ"}
    </button>
  );
}

export function RetentionContactQueue({ candidates, children }: { candidates: readonly ContactCandidate[]; children: ReactNode }) {
  // Deliberately ephemeral: no storage, persistence, network or messaging adapter.
  const [entries, setEntries] = useState<readonly ContactEntry[]>([]);
  const [notice, setNotice] = useState("");
  const selected = entries.flatMap((entry) => {
    const candidate = candidates.find((item) => item.id === entry.candidateId);
    return candidate ? [{ ...candidate, contacted: entry.contacted }] : [];
  });
  const contactedCount = selected.filter((item) => item.contacted).length;

  function add(candidateId: string) {
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;
    setEntries((current) => current.some((entry) => entry.candidateId === candidateId)
      ? current
      : [...current, { candidateId, contacted: false }]);
    setNotice("Đã chọn " + candidate.name + " vào danh sách trong phiên demo. Chưa gửi tin.");
  }

  function toggle(candidateId: string) {
    if (!candidates.some((item) => item.id === candidateId)) return;
    setEntries((current) => current.map((entry) => entry.candidateId === candidateId
      ? { ...entry, contacted: !entry.contacted }
      : entry));
    setNotice("Đã đổi dấu theo dõi trong phiên demo. Đây không phải xác nhận cuộc gọi hay tin nhắn đã gửi.");
  }

  function remove(candidateId: string) {
    setEntries((current) => current.filter((entry) => entry.candidateId !== candidateId));
    setNotice("Đã bỏ mục khỏi danh sách trong phiên demo; dữ liệu khách và lịch hẹn không thay đổi.");
  }

  return (
    <ContactContext.Provider value={{ candidates, entries, add }}>
      <div className={styles.shortcut}>
        <a href="#contact-shortlist">Xem danh sách liên hệ ({selected.length})</a>
        <span>Chọn từ các gợi ý bên dưới · không gửi tin tự động</span>
      </div>
      {children}
      <section id="contact-shortlist" tabIndex={-1} className={styles.panel} aria-label="Danh sách liên hệ trong phiên demo">
        <div className={styles.heading}>
          <div><span className={styles.eyebrow}>THAO TÁC DEMO</span><h2>Danh sách liên hệ đã chọn</h2></div>
          <p data-testid="contact-shortlist-count">{selected.length} mục · {selected.length - contactedCount} chờ liên hệ · {contactedCount} đã đánh dấu</p>
        </div>
        <p id="contact-shortlist-note" className={styles.note}>Chỉ lưu trong màn hình demo hiện tại. Tải lại trang sẽ xóa danh sách. Không gửi SMS/Zalo và không lưu dữ liệu thật.</p>
        <p role="status" aria-atomic="true" className={styles.notice}>{notice}</p>
        {selected.length ? (
          <ul className={styles.list} aria-label="Các mục liên hệ đã chọn">
            {selected.map((item) => (
              <li key={item.id} className={styles.item} aria-label={item.name + " · " + item.source}>
                <div className={styles.details}>
                  <strong>{item.name}</strong>
                  <span>{item.source} · {item.service}</span>
                  <b className={styles.state}>{item.contacted ? "Đã đánh dấu liên hệ (demo)" : "Chờ liên hệ (demo)"}</b>
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.control} aria-pressed={item.contacted} onClick={() => toggle(item.id)}>
                    {item.contacted ? "Chuyển lại chờ liên hệ" : "Đánh dấu đã liên hệ"}
                  </button>
                  <button type="button" className={styles.control} onClick={() => remove(item.id)}>Bỏ khỏi danh sách</button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className={styles.empty}>Chưa chọn khách để liên hệ. Chọn một mục tái đặt hoặc khách không đến ở phía trên.</p>}
      </section>
    </ContactContext.Provider>
  );
}
