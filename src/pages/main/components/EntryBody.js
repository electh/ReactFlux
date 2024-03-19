import ReactHtmlParser from "html-react-parser";
import { Image } from "@arco-design/web-react";
import { useConfigStore } from "../../../store/configStore";

// 自定义解析规则，用于替换img标签
const htmlParserOptions = {
  replace: (node) => {
    if (node.name === "img") {
      const { src, alt } = node.attribs;
      return (
        <Image
          src={src}
          alt={alt}
          previewProps={{
            actionsLayout: [
              "rotateRight",
              "rotateLeft",
              "zoomIn",
              "zoomOut",
              "originalSize",
            ],
          }}
        />
      );
    }
  },
};

export default function EntryBody({ htmlString }) {
  const reactElement = ReactHtmlParser(htmlString, htmlParserOptions);
  const contentSize = useConfigStore((state) => state.contentSize);
  const align = useConfigStore((state) => state.align);
  return (
    <div
      className="article-body"
      style={{
        fontSize: `${contentSize}rem`,
        overflowWrap: "break-word",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto",
        textAlign: align,
      }}
    >
      {reactElement}
    </div>
  );
}
