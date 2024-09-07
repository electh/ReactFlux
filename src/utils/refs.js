export const mergeRefs =
  (...refs) =>
  (el) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(el);
      } else if (ref && typeof ref === "object") {
        ref.current = el;
      }
    }
  };
