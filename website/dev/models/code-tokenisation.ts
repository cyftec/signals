export type CodeTokenType = "plain" | "cm" | "str" | "num" | "kw" | "fn";

export type CodeToken = [CodeTokenType, string];
