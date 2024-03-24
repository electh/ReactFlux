import { Divider, Drawer, Typography } from "@arco-design/web-react";
import AccentColor from "./components/AccentColor";
import CompactLayout from "./components/CompactLayout";
import FontSize from "./components/FontSize";
import TextAlignment from "./components/TextAlignment";
import Favicons from "./components/Favicons";

export default function Appearance({ visible, setVisible }) {
  return (
    <Drawer
      width={332}
      title={
        <Typography.Title heading={6} style={{ margin: 0 }}>
          Appearance
        </Typography.Title>
      }
      footer={null}
      visible={visible}
      onCancel={() => {
        setVisible(false);
      }}
    >
      <AccentColor />
      <Divider />
      <CompactLayout />
      <Divider />
      <Favicons />
      <Divider />
      <TextAlignment />
      <Divider />
      <FontSize />
    </Drawer>
  );
}
