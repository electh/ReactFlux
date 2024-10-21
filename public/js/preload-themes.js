const themes = [
  "blue",
  "gray",
  "green",
  "neutral",
  "orange",
  "red",
  "slate",
  "stone",
  "violet",
  "yellow",
  "zine",
];

for (const theme of themes) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = `/styles/${theme}-theme.css`;
  link.as = "style";
  document.head.appendChild(link);
}
