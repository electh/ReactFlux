import sanitize from "sanitize-html";

const getSanitizeOptions = () => ({
  allowedTags: sanitize.defaults.allowedTags.concat(["img"]),
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    img: [
      "alt",
      "class",
      "height",
      "loading",
      "src",
      "srcset",
      "style",
      "title",
      "width",
    ],
    // used by littlefoot
    a: ["href", "name", "target", "rel", "referrerpolicy"],
    sup: ["id"],
    li: ["id"],
  },
  allowedSchemes: ["http", "https", "data", "mailto"],
});

const sanitizeHtml = (content) => {
  const sanitizeOptions = getSanitizeOptions();
  return sanitize(content, sanitizeOptions);
};

export default sanitizeHtml;
