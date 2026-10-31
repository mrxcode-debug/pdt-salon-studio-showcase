export type AppointmentStatus =
  | "confirmed"
  | "arrived"
  | "in_service"
  | "completed"
  | "no_show"
  | "pending"
  | "cancelled";

export type Appointment = {
  id: string;
  time: string;
  startMinute: number;
  duration: number;
  customer: string;
  service: string;
  staff: string;
  status: AppointmentStatus;
  amount: number;
};

export type Customer = {
  name: string;
  phone: string;
  visits: number;
  lifetime: number;
  next: string;
  lastVisit?: string;
  lastService?: string;
  segment?: "VIP" | "Active" | "At risk";
  preference?: string;
  ownerNote?: string;
};

export const demoSalon = {
  name: "Lumière Salon",
  label: "DỮ LIỆU MẪU",
  today: "Demo Day",
  metrics: {
    bookings: 31,
    completed: 18,
    revenue: 18_600_000,
    target: 25_000_000,
    unpaidAmount: 1_630_000,
    unconfirmed: 4,
    noShow: 2,
    rebook: 7
  }
};

export const appointments: Appointment[] = [
  { id: "a1", time: "09:00", startMinute: 540, duration: 60, customer: "Nguyễn Minh Anh", service: "Cắt + tạo kiểu", staff: "Lan", status: "completed", amount: 420000 },
  { id: "a2", time: "09:30", startMinute: 570, duration: 180, customer: "Trần Thu Hà", service: "Nhuộm Balayage", staff: "Vy", status: "in_service", amount: 1650000 },
  { id: "a3", time: "10:00", startMinute: 600, duration: 45, customer: "Lê Ngọc Mai", service: "Gội dưỡng", staff: "Hương", status: "arrived", amount: 280000 },
  { id: "a4", time: "10:30", startMinute: 630, duration: 150, customer: "Phạm Bảo Ngọc", service: "Uốn phục hồi", staff: "Lan", status: "confirmed", amount: 1280000 },
  { id: "a5", time: "11:00", startMinute: 660, duration: 60, customer: "Hoàng Thanh Trúc", service: "Cắt layer", staff: "Hương", status: "pending", amount: 350000 },
  { id: "a6", time: "11:30", startMinute: 690, duration: 90, customer: "Đỗ Mỹ Linh", service: "Phục hồi Keratin", staff: "Vy", status: "no_show", amount: 890000 }
];

export const staff = [
  { name: "Lan", role: "Senior Stylist", booked: 7, capacity: 8, revenue: 5_820_000, commission: 873000 },
  { name: "Vy", role: "Colorist", booked: 6, capacity: 7, revenue: 6_440_000, commission: 966000 },
  { name: "Hương", role: "Stylist", booked: 5, capacity: 8, revenue: 3_780_000, commission: 453600 }
];

export const ownerAlerts = [
  { title: "4 lịch chưa xác nhận", detail: "Có 2 lịch trong 90 phút tới", href: "/calendar" },
  { title: "2 khách không đến", detail: "Cần gọi lại hoặc đưa vào hàng tái đặt", href: "/retention" },
  { title: "7 khách cần đặt lại", detail: "Đã 45–60 ngày chưa quay lại", href: "/retention" },
  { title: "3 sản phẩm sắp hết", detail: "Olaplex No.3 chỉ còn 2 chai", href: "/inventory" }
];

export const rebookCustomers = [
  { name: "Nguyễn Khánh Linh", lastVisit: "02/08", service: "Nhuộm + phục hồi", days: 50 },
  { name: "Vũ Thảo My", lastVisit: "06/08", service: "Cắt + uốn", days: 46 },
  { name: "Bùi Hồng Nhung", lastVisit: "09/08", service: "Balayage", days: 43 }
];

export const noShowQueue = [
  { name: "Đỗ Mỹ Linh", time: "11:30", service: "Phục hồi Keratin", staff: "Vy", amount: 890000 },
  { name: "Trần Gia Hân", time: "15:00", service: "Gội + phục hồi", staff: "Hương", amount: 420000 }
];

export const paymentQueue = [
  { name: "Phạm Bảo Ngọc", amount: 1280000, detail: "Lịch 10:30 · Uốn phục hồi" },
  { name: "Hoàng Thanh Trúc", amount: 350000, detail: "Lịch 11:00 · Cắt layer" }
];

export const inventory = [
  { name: "Olaplex No.3", stock: 2, threshold: 5, unit: "chai" },
  { name: "Thuốc nhuộm Ash 7.1", stock: 3, threshold: 6, unit: "tuýp" },
  { name: "Dầu gội Kerastase 1L", stock: 1, threshold: 3, unit: "chai" }
];

export const customers: Customer[] = [
  {
    name: "Nguyễn Minh Anh", phone: "09•• ••• 182", visits: 12, lifetime: 8_420_000, next: "Tái đặt sau 21 ngày",
    lastVisit: "31/08", lastService: "Cắt + tạo kiểu", segment: "VIP", preference: "Layer ôm mặt · sấy phồng nhẹ",
    ownerNote: "Ưu tiên lịch với Lan, thường đặt cuối tuần."
  },
  {
    name: "Trần Thu Hà", phone: "09•• ••• 744", visits: 8, lifetime: 12_680_000, next: "Đang phục vụ hôm nay",
    lastVisit: "12/08", lastService: "Nhuộm Balayage", segment: "VIP", preference: "Tone lạnh · hạn chế tẩy mạnh",
    ownerNote: "Giá trị cao, phù hợp gói dưỡng sau màu."
  },
  {
    name: "Lê Ngọc Mai", phone: "08•• ••• 305", visits: 5, lifetime: 2_960_000, next: "Gợi ý combo phục hồi",
    lastVisit: "05/08", lastService: "Gội dưỡng", segment: "At risk", preference: "Da đầu nhạy cảm",
    ownerNote: "Đã hơn 45 ngày chưa quay lại; ưu tiên tái kích hoạt."
  },
  {
    name: "Phạm Bảo Ngọc", phone: "09•• ••• 913", visits: 9, lifetime: 10_240_000, next: "Lịch 10:30 hôm nay",
    lastVisit: "18/08", lastService: "Uốn phục hồi", segment: "Active", preference: "Uốn lơi · giữ độ bóng",
    ownerNote: "Có lịch hôm nay; kiểm tra thanh toán sau dịch vụ."
  }
];

export const services = [
  { name: "Cắt + tạo kiểu", duration: 60, price: 420000, staff: "Lan, Hương" },
  { name: "Nhuộm Balayage", duration: 180, price: 1650000, staff: "Vy" },
  { name: "Uốn phục hồi", duration: 150, price: 1280000, staff: "Lan" },
  { name: "Gội dưỡng", duration: 45, price: 280000, staff: "Hương, Lan" }
];

export function money(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export function statusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    confirmed: "Đã xác nhận",
    arrived: "Đã đến",
    in_service: "Đang làm",
    completed: "Hoàn tất",
    no_show: "Không đến",
    pending: "Chờ xác nhận",
    cancelled: "Đã hủy"
  };
  return labels[status];
}
