import { Divider, Drawer, Typography } from "@arco-design/web-react";
import AccentColor from "./components/AccentColor";
import CompactLayout from "./components/CompactLayout";
import FontSize from "./components/FontSize";
import TextAlignment from "./components/TextAlignment";

export default function Settings({ visible, setVisible }) {
  return (
    <Drawer
      width={332}
      title={
        <Typography.Title heading={5} style={{ margin: 0 }}>
          Settings
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
      <TextAlignment />
      <Divider />
      <FontSize />
    </Drawer>
  );
}
