import { CodeToken } from "../models";

export function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const extractCodeTokens = (code: string, lang: string): CodeToken[] => {
  const source = code;
  if (!lang || !["typescript", "ts", "javascript", "js"].includes(lang))
    return [["plain", escapeHtml(source)]];
  const pattern =
    /\/\/.*?$|\/\*[\s\S]*?\*\/|`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b(?:export|import|from|const|let|var|type|interface|function|return|new|if|else|for|while|await|async|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][A-Za-z0-9_$]*(?=\()/gm;
  let last = 0;
  let tokens: CodeToken[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const plainStr = escapeHtml(source.slice(last, match.index));
    tokens.push(["plain", plainStr]);
    const token = match[0];
    if (/^\/\//.test(token) || /^\/\*/.test(token)) {
      tokens.push(["cm", escapeHtml(token)]);
    } else if (/^["'`]/.test(token)) {
      tokens.push(["str", escapeHtml(token)]);
    } else if (/^\d/.test(token)) {
      tokens.push(["num", escapeHtml(token)]);
    } else if (
      /^(export|import|from|const|let|var|type|interface|function|return|new|if|else|for|while|await|async|true|false|null|undefined)$/.test(
        token,
      )
    ) {
      tokens.push(["kw", escapeHtml(token)]);
    } else {
      tokens.push(["fn", escapeHtml(token)]);
    }
    last = pattern.lastIndex;
  }
  tokens.push(["plain", escapeHtml(source.slice(last))]);

  return tokens;
};
