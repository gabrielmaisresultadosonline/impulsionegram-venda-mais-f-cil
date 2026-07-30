/** Tipos compartilhados do funil de pedido da home. */

export type RegionMode = "cidade" | "cep";

export interface CampaignData {
  profileUrl: string;
  regionMode: RegionMode;
  regionValue: string;
  competitor: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export const EMPTY_CAMPAIGN: CampaignData = {
  profileUrl: "",
  regionMode: "cidade",
  regionValue: "",
  competitor: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
};

/** Texto final enviado ao servidor no campo `region`. */
export function formatRegion(data: CampaignData): string {
  return data.regionMode === "cep"
    ? `CEP ${data.regionValue}`
    : data.regionValue;
}

/** Mínimo e máximo de publicações exigidos no pedido. */
export const MIN_POSTS = 3;
export const MAX_POSTS = 5;
