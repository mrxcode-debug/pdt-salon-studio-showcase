import { Shell } from "../../components/shell";
import { Card, PageHeader } from "../../components/ui";
import { inventory } from "../../lib/demo-data";

export default function InventoryPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="KHO"
        title="Cảnh báo tồn kho"
        description="Pilot chỉ hiển thị low-stock; append-only stock movement sẽ vào Block 06."
      />
      <Card>
        <div className="inventory-list">
          {inventory.map((item) => (
            <div className="inventory-row" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <span>Ngưỡng cảnh báo: {item.threshold} {item.unit}</span>
              </div>
              <div className="stock-low">{item.stock} {item.unit}</div>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
