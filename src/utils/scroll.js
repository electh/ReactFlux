const scrollToElement = (selector, block = "start") => {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block });
  }
};

export { scrollToElement };
