import ReactHtmlParser from "html-react-parser";
import { useConfigStore } from "../../../store/configStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

// 自定义解析规则，用于替换img标签
const htmlParserOptions = {
  replace: (node) => {
    if (node.name === "img") {
      const { src, alt } = node.attribs;
      return (
        <PhotoProvider maskOpacity={0.7} bannerVisible={false}>
          <PhotoView src={src}>
            <img src={src} alt={alt} />
          </PhotoView>
        </PhotoProvider>
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
