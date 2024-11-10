export const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const images = doc.querySelectorAll("img");
  return Array.from(images).map((img) => img.getAttribute("src"));
};

export const parseFirstImage = (entry) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(entry.content, "text/html");
  let imgSrc = doc.querySelector("img")?.getAttribute("src");
  if (!imgSrc) {
    imgSrc = doc.querySelector("video")?.getAttribute("poster");
  }
  return { ...entry, imgSrc };
};
