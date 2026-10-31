import { CheckoutPanel } from "../../components/checkout-panel";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { appointments, customers } from "../../lib/demo-data";

export default function CheckoutPage() {
  const active = appointments.find((item) => item.status === "in_service") ?? appointments[0];
  const customer = customers.find((item) => item.name === active.customer) ?? customers[0];

  return (
    <Shell>
      <PageHeader
        eyebrow="THU TIỀN"
        title="Checkout & hoa hồng"
        description="Chốt tiền, hoa hồng, tồn kho, lịch sử khách và tín hiệu tái đặt trong cùng một trace."
      />
      <CheckoutPanel appointment={active} customer={customer} />
    </Shell>
  );
}
