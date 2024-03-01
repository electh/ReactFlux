import { Card } from "@arco-design/web-react";
import { Link } from "react-router-dom";

export default function All() {
  return (
    <div>
      <Card
        style={{ width: 360 }}
        title="Arco Card"
        hoverable
        extra={<Link>More</Link>}
      >
        Card content
        <br />
        Card content
      </Card>
    </div>
  );
}
