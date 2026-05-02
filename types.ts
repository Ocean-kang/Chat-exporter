export interface Message {
  id: string;
  role: string;
  content: string;
  parentId?: string;
}

export interface Conversation {
  title: string;
  messages: Message[];
}
