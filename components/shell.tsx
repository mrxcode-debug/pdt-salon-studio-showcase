import Link from "next/link";

const desktopNav = [
  ["Tổng quan", "/"],
  ["Lịch hẹn", "/calendar"],
  ["Khách hàng", "/customers"],
  ["Checkout", "/checkout"],
  ["Giữ khách", "/retention"],
  ["Dịch vụ", "/services"],
  ["Kho", "/inventory"]
];

const mobileNav = [
  ["Tổng quan", "/"],
  ["Lịch", "/calendar"],
  ["Khách", "/customers"],
  ["Thu tiền", "/checkout"],
  ["Giữ khách", "/retention"]
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="eyebrow">PDT LABS</div>
          <div className="brand">Salon Studio</div>
          <div className="demo-pill">PILOT · DỮ LIỆU MẪU</div>
        </div>
        <nav className="nav-list" aria-label="Điều hướng chính">
          {desktopNav.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
          ))}
        </nav>
        <div className="sidebar-note">Owner-first · Mobile-first<br />Không dữ liệu khách thật</div>
      </aside>
      <main className="content">
        <header className="mobile-topbar">
          <div><span className="eyebrow">PDT LABS</span><strong>Salon Studio</strong></div>
          <span className="demo-pill">MẪU</span>
        </header>
        {children}
        <nav className="mobile-nav" aria-label="Điều hướng di động">
          {mobileNav.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
