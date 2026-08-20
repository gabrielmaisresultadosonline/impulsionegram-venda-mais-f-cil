import { supabaseAdmin } from "./supabase-admin.server";

/**
 * Repositório de chats da homepage (visitantes não logados).
 * Migrado para Lovable Cloud (Supabase).
 */

export interface ChatMessage {
  id: string;
  author: "user" | "ai" | "admin" | "customer";
  text: string;
  createdAt: string;
}

export interface VisitorChat {
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  source: "home";
}

export async function getVisitorChat(email: string): Promise<VisitorChat | undefined> {
  const all = await listVisitorChats();
  return all.find(c => c.email.toLowerCase() === email.toLowerCase());
}

export async function saveVisitorChat(chat: VisitorChat): Promise<void> {
  // Garantir que o visitor_chat existe
  const { error } = await supabaseAdmin.from('visitor_chats').upsert({
    email: chat.email.toLowerCase(),
    visitor_id: chat.visitorId,
    name: chat.name,
    phone: chat.phone,
    last_message_at: chat.lastMessageAt || new Date().toISOString(),
    source: chat.source || 'home'
  });

  if (error) throw error;
}

export async function listVisitorChats(): Promise<VisitorChat[]> {
  const { data: chats, error: chatsError } = await supabaseAdmin
    .from('visitor_chats')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (chatsError) throw chatsError;

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('visitor_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  const messagesMap = new Map<string, ChatMessage[]>();
  messages?.forEach(msg => {
    const list = messagesMap.get(msg.visitor_email.toLowerCase()) || [];
    list.push({
      id: msg.id,
      author: msg.author as any,
      text: msg.text,
      createdAt: msg.created_at
    });
    messagesMap.set(msg.visitor_email.toLowerCase(), list);
  });

  return (chats || []).map(row => ({
    visitorId: row.visitor_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source as any,
    lastMessageAt: row.last_message_at,
    messages: messagesMap.get(row.email.toLowerCase()) || []
  }));
}

export async function addVisitorMessage(email: string, message: Omit<ChatMessage, "id" | "createdAt">): Promise<VisitorChat | undefined> {
  const now = new Date().toISOString();
  
  // Registrar mensagem
  const { error: msgError } = await supabaseAdmin.from('visitor_messages').insert({
    visitor_email: email.toLowerCase(),
    author: message.author,
    text: message.text,
    created_at: now
  });

  if (msgError) throw msgError;

  // Atualizar last_message_at
  await supabaseAdmin
    .from('visitor_chats')
    .update({ last_message_at: now })
    .eq('email', email.toLowerCase());

  return getVisitorChat(email);
}

