/** Tipos compartilhados do funil de pedido da home. */

export type RegionMode = "cidade" | "cep";

export interface CampaignData {
  profileUrl: string;
  adLink: string;
  regionMode: RegionMode;
  regionValue: string;
  competitor: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  turbinarLink?: string; // Novo campo para o link do post a turbinar
}

export const EMPTY_CAMPAIGN: CampaignData = {
  profileUrl: "",
  adLink: "",
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

