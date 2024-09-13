export const hideSpinner = () => {
  const spinner = document.querySelector(".spinner");
  if (spinner) {
    spinner.style.display = "none";
  }
};
