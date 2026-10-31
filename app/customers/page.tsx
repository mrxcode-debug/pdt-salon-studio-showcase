import { Customer360 } from "../../components/customer-360";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { customers } from "../../lib/demo-data";

export default function CustomersPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="CRM"
        title="Khách hàng"
        description="Customer 360: tìm nhanh, hiểu lịch sử và thấy ngay hành động giữ khách."
        action={<button className="secondary-button">+ Khách mới</button>}
      />
      <Customer360 customers={customers} />
    </Shell>
  );
}
