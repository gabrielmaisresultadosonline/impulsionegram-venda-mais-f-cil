import { supabaseAdmin } from "./supabase-admin.server";
import { addToFollowupQueue } from "./email-followup/engine.server";

/**
 * Repositório de cadastros (leads).
 * Migrado para Lovable Cloud (Supabase).
 */

export interface SignupRecord {
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  attempts: number;
  lastSeenAt: string;
  source?: string;
  profileUrl?: string;
  region?: string;
  competitor?: string;
  adLink?: string;
  turbinarLink?: string;
  profileSavedAt?: string;
}

/** Registra (ou atualiza) um cadastro feito na home. */
export async function recordSignup(input: {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  password?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin
    .from('signups')
    .select('*')
    .eq('email', email)
    .single();

  const record = {
    email,
    name: input.name.trim() || existing?.name || "",
    phone: input.phone?.trim() || existing?.phone,
    created_at: existing?.created_at ?? now,
    attempts: (existing?.attempts ?? 0) + 1,
    last_seen_at: now,
    source: existing?.source ?? input.source ?? "home",
    password: input.password || existing?.password
  };

  await supabaseAdmin.from('signups').upsert(record);
  
  await addToFollowupQueue(`lead:${email}`);

  try {
    const { sendTransactionalEmail } = await import("./transactional-emails.functions");
    await sendTransactionalEmail({ 
      data: { 
        type: "welcome",
        name: record.name, 
        email, 
        password: input.password || existing?.password,
        orderNsu: `lead:${email}` 
      } 
    });
  } catch (err) {
    console.error(`[recordSignup] Erro ao disparar e-mail para ${email}:`, err);
  }
}

/** Lista os cadastros do mais recente para o mais antigo. */
export async function listSignups(): Promise<SignupRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('signups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("[SignupsRepo] Erro ao listar do Supabase:", error);
    return [];
  }
  
  return (data || []).map(row => ({
    email: row.email,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at,
    attempts: row.attempts,
    lastSeenAt: row.last_seen_at,
    source: row.source,
    profileUrl: row.profile_url,
    region: row.region,
    competitor: row.competitor,
    adLink: row.ad_link,
    turbinarLink: row.turbinar_link,
    profileSavedAt: row.profile_saved_at
  }));
}

/**
 * Salva os dados da campanha no cadastro do cliente (antes do pagamento).
 */
export async function saveSignupProfile(input: {
  name?: string;
  email: string;
  phone?: string;
  profileUrl: string;
  region: string;
  competitor?: string;
  adLink?: string;
  turbinarLink?: string;
  source?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin
    .from('signups')
    .select('*')
    .eq('email', email)
    .single();

  const record = {
    email,
    name: input.name?.trim() || existing?.name || "",
    phone: input.phone?.trim() || existing?.phone,
    created_at: existing?.created_at ?? now,
    attempts: existing?.attempts ?? 1,
    last_seen_at: now,
    source: existing?.source ?? input.source ?? "home",
    profile_url: input.profileUrl.trim(),
    region: input.region.trim(),
    competitor: input.competitor?.trim() || existing?.competitor,
    ad_link: input.adLink?.trim() || existing?.adLink,
    turbinar_link: input.turbinarLink?.trim() || existing?.turbinarLink,
    profile_saved_at: now,
  };

  await supabaseAdmin.from('signups').upsert(record);
}
