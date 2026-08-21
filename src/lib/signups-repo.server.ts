import { supabaseAdmin } from "./supabase.server";

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
  profileSavedAt?: string;
}

export async function recordSignup(input: {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  password?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  const { data: existing } = await supabaseAdmin
    .from('signups')
    .select('*')
    .eq('email', email)
    .single();

  const now = new Date().toISOString();
  
  const record = {
    email,
    name: input.name.trim() || existing?.name || "",
    phone: input.phone?.trim() || existing?.phone,
    created_at: existing?.created_at ?? now,
    attempts: (existing?.attempts ?? 0) + 1,
    last_seen_at: now,
    source: existing?.source ?? input.source ?? "home",
  };

  await supabaseAdmin.from('signups').upsert(record);
  
  // Followup e e-mail...
  const { addToFollowupQueue } = await import("./email-followup/engine.server");
  addToFollowupQueue(`lead:${email}`);

  try {
    const { sendTransactionalEmailInternal } = await import("./transactional-emails.functions");
    await sendTransactionalEmailInternal({ 
      type: "welcome",
      name: record.name, 
      email, 
      password: input.password,
      orderNsu: `lead:${email}` 
    });
  } catch (err) {
    console.error(`[recordSignup] Erro e-mail:`, err);
  }
}

export async function listSignups(): Promise<SignupRecord[]> {
  const { data } = await supabaseAdmin
    .from('signups')
    .select('*')
    .order('created_at', { ascending: false });
    
  return (data || []).map(s => ({
    email: s.email,
    name: s.name,
    phone: s.phone,
    createdAt: s.created_at,
    attempts: s.attempts,
    lastSeenAt: s.last_seen_at,
    source: s.source,
    profileUrl: s.profile_url,
    region: s.region,
    competitor: s.competitor,
    adLink: s.ad_link,
    profileSavedAt: s.profile_saved_at
  }));
}

export async function saveSignupProfile(input: {
  name?: string;
  email: string;
  phone?: string;
  profileUrl: string;
  region: string;
  competitor?: string;
  adLink?: string;
  source?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  const { data: existing } = await supabaseAdmin
    .from('signups')
    .select('*')
    .eq('email', email)
    .single();

  const now = new Date().toISOString();
  
  await supabaseAdmin.from('signups').upsert({
    email,
    name: input.name?.trim() || existing?.name || "",
    phone: input.phone?.trim() || existing?.phone,
    profile_url: input.profileUrl.trim(),
    region: input.region.trim(),
    competitor: input.competitor?.trim() || existing?.competitor,
    ad_link: input.adLink?.trim() || existing?.adLink,
    profile_saved_at: now,
    last_seen_at: now
  });
}

/**
 * Gravação parcial (auto-save) do quiz. Só escreve os campos preenchidos,
 * preservando o que já existe no banco — nunca apaga dado válido com vazio.
 */
export async function saveSignupProfileDraft(input: {
  name?: string;
  email: string;
  phone?: string;
  profileUrl?: string;
  region?: string;
  competitor?: string;
  adLink?: string;
  source?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  const { data: existing } = await supabaseAdmin
    .from("signups")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const now = new Date().toISOString();
  const pick = (value: string | undefined, fallback: unknown) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : (fallback ?? null);
  };

  await supabaseAdmin.from("signups").upsert({
    email,
    name: pick(input.name, existing?.name) ?? "",
    phone: pick(input.phone, existing?.phone),
    profile_url: pick(input.profileUrl, existing?.profile_url),
    region: pick(input.region, existing?.region),
    competitor: pick(input.competitor, existing?.competitor),
    ad_link: pick(input.adLink, existing?.ad_link),
    source: existing?.source ?? input.source ?? "home",
    created_at: existing?.created_at ?? now,
    attempts: existing?.attempts ?? 1,
    profile_saved_at: now,
    last_seen_at: now,
  });
}

