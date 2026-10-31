import { PilotJourney } from "../../components/pilot-journey";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { appointments, customers } from "../../lib/demo-data";

export default function PilotPage() {
  const appointment = appointments.find((item) => item.id === "a4") ?? appointments[0];
  const customer = customers.find((item) => item.name === appointment.customer) ?? customers[0];

  return (
    <Shell>
      <PageHeader
        eyebrow="PILOT ACCEPTANCE"
        title="Hành trình khách hàng mẫu"
        description="Một flow liền mạch: xác nhận → đến salon → thực hiện → thanh toán → lịch sử → tái đặt."
      />
      <PilotJourney appointment={appointment} customer={customer} />
    </Shell>
  );
}
