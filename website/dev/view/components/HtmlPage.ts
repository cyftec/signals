import { component, m } from "@cyftec/maya/core";
import { Header } from "./Header";

type HtmlPageProps = {
  title?: string;
  children: any;
};

export const HtmlPage = component<HtmlPageProps>(({ title, children }) =>
  m.Html({
    lang: "en",
    children: [
      m.Head({
        children: [
          m.Title(
            `${title?.value ? `${title.value} | ` : ""}Cyftec Signal Docs`,
          ),
          m.Meta({ charset: "UTF-8" }),
          m.Meta({
            name: "viewport",
            content: "width=device-width, initial-scale=1",
          }),
          m.Link({ rel: "stylesheet", href: "/assets/docs.css" }),
          m.Link({
            rel: "icon",
            type: "image/x-icon",
            href: "/assets/images/favicon.ico",
          }),
        ],
      }),
      m.Body({
        children: [
          m.Script({ src: "main.js", defer: true }),
          Header(),
          children,
        ],
      }),
    ],
  }),
);
