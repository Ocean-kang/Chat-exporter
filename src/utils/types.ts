export interface Message {
  id: string;
  role: string;
  content: string;
  parentId?: string;
  create_time?: number;
}

export interface Conversation {
  title: string;
  messages: Message[];
}

export interface RawChatData {
  title?: string;
  mapping?: Record<string, RawNode>;
}

export interface RawNode {
  id?: string;
  message?: RawMessage;
  parent?: string | null;
  children?: string[];
}

export interface RawMessage {
  id?: string;
  author?: { role?: string };
  role?: string;
  content?: RawContent;
  create_time?: number;
}

export type RawContent =
  | string
  | { parts?: RawPart[]; text?: string; content_type?: string }
  | RawPart[];

export type RawPart =
  | string
  | { text?: string; content_type?: string };

export interface ExportOptions {
  includeUser: boolean;
  includeAssistant: boolean;
  includeSystem: boolean;
  includeMetadata: boolean;
  separator: string;
  filenameTemplate: string;
}

export type ExportState = "idle" | "loading" | "success" | "error";
