import { signal } from "@cyftec/maya/signal";

let windowFound = false;
const isMobile = signal(true);

export const getIsMobileSignal = () => {
  if (windowFound) return isMobile;

  if (window && "matchMedia" in window) {
    windowFound = true;
    const mobileQuery = window.matchMedia("(max-width: 980px)");
    isMobile.value = mobileQuery.matches;
    mobileQuery.addEventListener("change", () => {
      isMobile.value = mobileQuery.matches;
    });
  }
  return isMobile;
};
