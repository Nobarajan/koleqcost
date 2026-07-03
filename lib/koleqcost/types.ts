export type RateSource = "live" | "manual" | "fallback" | "cached";

export type TaxPreset = "courier" | "traveller" | "manual" | "custom";

export type TaxBasis = "full_cif" | "above_exemption";

export type ExchangeRates = {
  usdMyr: number;
  lastUpdatedUtc: string | null;
  source: RateSource;
};

export type BuyingInputs = {
  itemPriceUsd: number;
  postageUsd: number;
  quantity: number;
  note: string;
  taxPreset: TaxPreset;
  taxBasis: TaxBasis;
  exemptionMyr: number;
  importDutyPct: number;
  salesTaxPct: number;
  exciseDutyPct: number;
  manualCustomsChargeMyr: number;
  agentHandlingFeeMyr: number;
  ediSmkFeeMyr: number;
  otherCourierFeeMyr: number;
  othersCostMyr: number;
};

export type BuyingResults = {
  cifUsd: number;
  cifMyr: number;
  taxPresetLabel: string;
  taxBasisLabel: string;
  taxBaseMyr: number;
  importDutyMyr: number;
  exciseDutyMyr: number;
  salesTaxMyr: number;
  customsTaxMyr: number;
  agentHandlingFeeMyr: number;
  ediSmkFeeMyr: number;
  otherCourierFeeMyr: number;
  othersCostMyr: number;
  landedCostMyr: number;
  landedCostUsd: number;
  avgCostPerItemMyr: number;
  avgCostPerItemUsd: number;
};

export type DisplayCurrency = "USD" | "MYR" | "ALL";

export const DISPLAY_CURRENCY_OPTIONS: DisplayCurrency[] = [
  "USD",
  "MYR",
  "ALL",
];

export const DEFAULT_RESALE_DISPLAY_CURRENCY: DisplayCurrency = "MYR";
export const DEFAULT_PROFIT_DISPLAY_CURRENCY: DisplayCurrency = "ALL";

export type SellingMethod = "ebay" | "physical";

export const SELLING_METHOD_OPTIONS: {
  value: SellingMethod;
  label: string;
}[] = [
  { value: "ebay", label: "eBay" },
  { value: "physical", label: "Physical" },
];

export type ResaleInputs = {
  sellingMethod: SellingMethod;
  soldPriceUsd: number;
  buyerShippingChargedUsd: number;
  shippingCostToBuyerUsd: number;
  ebayFeePct: number;
  internationalFeePct: number;
  promotedFeePct: number;
  fixedOrderFeeUsd: number;
  otherCostUsd: number;
  localSellingPriceMyr: number;
  platformMeetupFeeMyr: number;
  deliveryTransportCostMyr: number;
  discountNegoAmountMyr: number;
  otherCostMyr: number;
  resaleMultiplierPercent: number;
};

/** @deprecated Use ResaleInputs */
export type EbayInputs = ResaleInputs;

export type ProfitVerdict = "loss" | "thin" | "okay" | "strong" | null;

export type ResaleResults = {
  sellingMethod: SellingMethod;
  grossSaleUsd: number;
  grossSaleMyr: number;
  totalFeesUsd: number;
  totalFeesMyr: number;
  platformMeetupFeeUsd: number;
  platformMeetupFeeMyr: number;
  deliveryTransportCostUsd: number;
  deliveryTransportCostMyr: number;
  discountNegoAmountUsd: number;
  discountNegoAmountMyr: number;
  otherCostUsd: number;
  otherCostMyr: number;
  netReceivedUsd: number;
  netReceivedMyr: number;
  profitUsd: number;
  profitMyr: number;
  roiPct: number | null;
  marginPct: number | null;
  breakEvenSellPriceUsd: number | null;
  breakEvenSellPriceMyr: number | null;
  resaleAfterPercentUsd: number;
  resaleAfterPercentMyr: number;
  profitAfterPercentUsd: number;
  profitAfterPercentMyr: number;
  roiAfterPercent: number;
  verdict: ProfitVerdict;
};

/** @deprecated Use ResaleResults */
export type EbayResults = ResaleResults;

export type HistoryEntry = {
  id: string;
  buying: BuyingInputs;
  resale: ResaleInputs;
  rates: { usdMyr: number };
  notes: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Flat snapshot shape used before the portfolio-tracker redesign. */
export type LegacyHistoryEntry = {
  id: string;
  note: string;
  itemPriceUsd: number;
  postageUsd: number;
  quantity: number;
  usdMyr: number;
  usdJpy?: number;
  cifMyr: number;
  totalTaxMyr: number;
  landedCostMyr: number;
  avgCostPerItemMyr: number;
  sellingMethod: SellingMethod | null;
  sellingPriceUsd: number | null;
  sellingPriceMyr: number | null;
  netReceivedMyr: number | null;
  ebaySoldPriceUsd: number | null;
  profitMyr: number | null;
  roiPct: number | null;
  resaleMultiplierPercent: number | null;
  resaleAfterPercentUsd: number | null;
  resaleAfterPercentMyr: number | null;
  profitAfterPercentMyr: number | null;
  roiAfterPercent: number | null;
  savedAt: string;
};

export type SortOption =
  | "newest"
  | "profit-desc"
  | "profit-asc"
  | "roi-desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "profit-desc", label: "Highest profit" },
  { value: "roi-desc", label: "Highest ROI" },
  { value: "profit-asc", label: "Lowest profit" },
];

export const DEFAULT_SORT_OPTION: SortOption = "newest";

export const DEFAULT_BUYING_INPUTS: BuyingInputs = {
  itemPriceUsd: 0,
  postageUsd: 0,
  quantity: 1,
  note: "",
  taxPreset: "courier",
  taxBasis: "full_cif",
  exemptionMyr: 1000,
  importDutyPct: 10,
  salesTaxPct: 10,
  exciseDutyPct: 10,
  manualCustomsChargeMyr: 0,
  agentHandlingFeeMyr: 30,
  ediSmkFeeMyr: 18,
  otherCourierFeeMyr: 0,
  othersCostMyr: 0,
};

export const DEFAULT_RESALE_INPUTS: ResaleInputs = {
  sellingMethod: "ebay",
  soldPriceUsd: 0,
  buyerShippingChargedUsd: 0,
  shippingCostToBuyerUsd: 0,
  ebayFeePct: 13.25,
  internationalFeePct: 1.65,
  promotedFeePct: 0,
  fixedOrderFeeUsd: 0.4,
  otherCostUsd: 0,
  localSellingPriceMyr: 0,
  platformMeetupFeeMyr: 0,
  deliveryTransportCostMyr: 0,
  discountNegoAmountMyr: 0,
  otherCostMyr: 0,
  resaleMultiplierPercent: 80,
};

/** @deprecated Use DEFAULT_RESALE_INPUTS */
export const DEFAULT_EBAY_INPUTS = DEFAULT_RESALE_INPUTS;

export const FALLBACK_RATES: ExchangeRates = {
  usdMyr: 4.7,
  lastUpdatedUtc: null,
  source: "fallback",
};

export const TAX_PRESET_OPTIONS: {
  value: TaxPreset;
  label: string;
  description: string;
}[] = [
  {
    value: "courier",
    label: "Courier estimate",
    description: "Tax on full CIF value",
  },
  {
    value: "traveller",
    label: "Traveller exemption",
    description: "Tax only above RM1,000",
  },
  {
    value: "manual",
    label: "Manual actual charges",
    description: "Use real customs bill",
  },
  {
    value: "custom",
    label: "Custom rates",
    description: "Set your own tax rates",
  },
];

export const TAX_PRESET_SHORT_LABELS: Record<TaxPreset, string> = {
  courier: "Courier",
  traveller: "Traveller",
  manual: "Manual",
  custom: "Custom rates",
};

export const TAX_PRESET_SUMMARY_LABELS: Record<TaxPreset, string> = {
  courier: "Estimate",
  traveller: "Exemption",
  manual: "Manual",
  custom: "Custom",
};

export const TAX_BASIS_LABELS: Record<TaxBasis, string> = {
  full_cif: "Full CIF value",
  above_exemption: "Above exemption only",
};
