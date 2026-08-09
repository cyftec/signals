import { m, MayaNode } from "@cyftec/maya/core";
import { derive, signal } from "@cyftec/maya/signal";

const locationPath = signal("/");

const selectedCss = (path: string = "/") => {
  return derive(() => (locationPath.value === path ? "selected" : ""));
};

export const Header = () =>
  m.Nav({
    onmount: (el: MayaNode) =>
      (locationPath.value = window?.location?.pathname || "/"),
    class: "header",
    children: [
      m.A({
        class: "header-brand",
        href: "/",
        children: [
          m.Img({
            src: "/assets/images/signal-logo.svg",
            alt: "Cyftec Signal Logo",
          }),
          m.Span({ children: "" }),
        ],
      }),
      m.Div({
        class: "header-links",
        children: [
          m.A({
            class: selectedCss("/api-docs/"),
            href: "/api-docs/",
            children: "API Docs",
          }),
          m.A({
            class: selectedCss("/tutorial/"),
            href: "/tutorial/",
            children: "Tutorial",
          }),
          m.A({
            class: selectedCss("/architecture/"),
            href: "/architecture/",
            children: "Architecture",
          }),
        ],
      }),
    ],
  });
