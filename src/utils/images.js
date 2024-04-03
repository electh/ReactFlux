const extractAllImageSrc = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const images = doc.querySelectorAll("img");
  return Array.from(images).map((img) => img.getAttribute("src"));
};

export { extractAllImageSrc };
