import ReactHtmlParser from "html-react-parser";
import { useConfigStore } from "../../../store/configStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

// 自定义解析规则，用于替换 img 标签
const htmlParserOptions = {
  replace: (node) => {
    const isAnchorWithImg =
      node.name === "a" && node.children?.[0]?.name === "img";
    const isImgNode = node.name === "img";

    if (isAnchorWithImg || isImgNode) {
      const imgNode = isAnchorWithImg ? node.children[0] : node;
      const { src, alt } = imgNode.attribs;

      return (
        <PhotoView src={src}>
          <img src={src} alt={alt} />
        </PhotoView>
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
      <PhotoProvider maskOpacity={0.7}>{reactElement}</PhotoProvider>
    </div>
  );
}
