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
      "style",
      "title",
      "width",
    ],
  },
  allowedSchemes: ["http", "https", "data", "mailto"],
});

const sanitizeHtml = (content) => {
  const sanitizeOptions = getSanitizeOptions();
  return sanitize(content, sanitizeOptions);
};

export default sanitizeHtml;
