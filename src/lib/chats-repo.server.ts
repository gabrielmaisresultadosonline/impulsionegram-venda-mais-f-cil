import fs from "node:fs";

/**
 * Repositório de chats da homepage (visitantes não logados).
 * O histórico de usuários logados (/painel) continua vinculado aos pedidos (orders-repo.server.ts).
 */

export interface ChatMessage {
  id: string;
  author: "user" | "ai" | "admin";
  text: string;
  createdAt: string;
}

export interface VisitorChat {
  visitorId: string; // E-mail ou UUID gerado
  name: string;
  email: string;
  phone: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  source: "home";
}

const DATA_DIR = process.env.ORDERS_DATA_DIR ?? ".data";
const DATA_FILE = `${DATA_DIR}/visitor_chats.json`;
const chats = new Map<string, VisitorChat>();
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as VisitorChat[];
    for (const chat of parsed) chats.set(chat.email.toLowerCase(), chat);
  } catch {}
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([...chats.values()]), "utf8");
  } catch {}
}

export function getVisitorChat(email: string): VisitorChat | undefined {
  load();
  return chats.get(email.toLowerCase());
}

export function saveVisitorChat(chat: VisitorChat) {
  load();
  chats.set(chat.email.toLowerCase(), chat);
  persist();
}

export function listVisitorChats(): VisitorChat[] {
  load();
  return [...chats.values()].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function addVisitorMessage(email: string, message: Omit<ChatMessage, "id" | "createdAt">): VisitorChat | undefined {
  load();
  const chat = chats.get(email.toLowerCase());
  if (!chat) return undefined;
  
  const newMessage: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  chat.messages.push(newMessage);
  chat.lastMessageAt = newMessage.createdAt;
  persist();
  return chat;
}
