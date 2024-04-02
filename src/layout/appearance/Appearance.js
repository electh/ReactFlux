import { Divider, Drawer } from "@arco-design/web-react";
import AccentColor from "./components/AccentColor";
import CompactLayout from "./components/CompactLayout";
import FontSize from "./components/FontSize";
import TextAlignment from "./components/TextAlignment";
import Favicons from "./components/Favicons";
import Theme from "./components/Theme";

export default function Appearance({ visible, setVisible }) {
  return (
    <Drawer
      width={332}
      title={null}
      closable={false}
      footer={null}
      visible={visible}
      onCancel={() => {
        setVisible(false);
      }}
      unmountOnExit
    >
      <Theme />
      <Divider />
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
