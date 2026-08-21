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
    const { sendTransactionalEmail } = await import("./transactional-emails.functions");
    await sendTransactionalEmail({ 
      data: { 
        type: "welcome",
        name: record.name, 
        email, 
        password: input.password,
        orderNsu: `lead:${email}` 
      } 
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
