import type {
  BuyingInputs,
  BuyingResults,
  ResaleInputs,
  ResaleResults,
  ProfitVerdict,
  TaxPreset,
} from "./types";
import { TAX_BASIS_LABELS, TAX_PRESET_OPTIONS } from "./types";

function getTaxPresetLabel(preset: TaxPreset): string {
  return TAX_PRESET_OPTIONS.find((option) => option.value === preset)?.label ?? preset;
}

function getTaxBasisLabel(inputs: BuyingInputs): string {
  switch (inputs.taxPreset) {
    case "courier":
      return TAX_BASIS_LABELS.full_cif;
    case "traveller":
      return `${TAX_BASIS_LABELS.above_exemption} (RM${inputs.exemptionMyr.toLocaleString("en-MY")})`;
    case "manual":
      return "Manual entry";
    case "custom":
      return inputs.taxBasis === "full_cif"
        ? TAX_BASIS_LABELS.full_cif
        : `${TAX_BASIS_LABELS.above_exemption} (RM${inputs.exemptionMyr.toLocaleString("en-MY")})`;
  }
}

function computeCustomsTax(
  inputs: BuyingInputs,
  cifMyr: number,
): Pick<
  BuyingResults,
  | "taxBaseMyr"
  | "importDutyMyr"
  | "exciseDutyMyr"
  | "salesTaxMyr"
  | "customsTaxMyr"
> {
  if (inputs.taxPreset === "manual") {
    return {
      taxBaseMyr: 0,
      importDutyMyr: 0,
      exciseDutyMyr: 0,
      salesTaxMyr: 0,
      customsTaxMyr: inputs.manualCustomsChargeMyr,
    };
  }

  const taxBaseMyr =
    inputs.taxPreset === "courier" ||
    (inputs.taxPreset === "custom" && inputs.taxBasis === "full_cif")
      ? cifMyr
      : Math.max(0, cifMyr - inputs.exemptionMyr);

  const importDutyMyr = taxBaseMyr * (inputs.importDutyPct / 100);
  const exciseDutyMyr = taxBaseMyr * (inputs.exciseDutyPct / 100);
  const salesTaxMyr =
    (taxBaseMyr + importDutyMyr + exciseDutyMyr) * (inputs.salesTaxPct / 100);
  const customsTaxMyr = importDutyMyr + exciseDutyMyr + salesTaxMyr;

  return {
    taxBaseMyr,
    importDutyMyr,
    exciseDutyMyr,
    salesTaxMyr,
    customsTaxMyr,
  };
}

export function computeBuyingCost(
  inputs: BuyingInputs,
  usdMyr: number,
): BuyingResults | null {
  if (inputs.itemPriceUsd <= 0 || usdMyr <= 0) {
    return null;
  }

  const quantity = Math.max(inputs.quantity, 1);
  const cifUsd = inputs.itemPriceUsd + inputs.postageUsd;
  const cifMyr = cifUsd * usdMyr;

  const customs = computeCustomsTax(inputs, cifMyr);

  const agentHandlingFeeMyr = inputs.agentHandlingFeeMyr;
  const ediSmkFeeMyr = inputs.ediSmkFeeMyr;
  const otherCourierFeeMyr = inputs.otherCourierFeeMyr;
  const othersCostMyr = inputs.othersCostMyr;

  const landedCostMyr =
    cifMyr +
    customs.customsTaxMyr +
    agentHandlingFeeMyr +
    ediSmkFeeMyr +
    otherCourierFeeMyr +
    othersCostMyr;
  const landedCostUsd = landedCostMyr / usdMyr;
  const avgCostPerItemMyr = landedCostMyr / quantity;
  const avgCostPerItemUsd = landedCostUsd / quantity;

  return {
    cifUsd,
    cifMyr,
    taxPresetLabel: getTaxPresetLabel(inputs.taxPreset),
    taxBasisLabel: getTaxBasisLabel(inputs),
    ...customs,
    agentHandlingFeeMyr,
    ediSmkFeeMyr,
    otherCourierFeeMyr,
    othersCostMyr,
    landedCostMyr,
    landedCostUsd,
    avgCostPerItemMyr,
    avgCostPerItemUsd,
  };
}

function getProfitVerdict(profitUsd: number, roiPct: number | null): ProfitVerdict {
  if (profitUsd < 0) return "loss";
  if (roiPct === null) return null;
  if (roiPct < 0.1) return "thin";
  if (roiPct <= 0.25) return "okay";
  return "strong";
}

function amountPairFromUsd(
  usd: number,
  usdMyr: number,
): { usd: number; myr: number } {
  return { usd, myr: usd * usdMyr };
}

function amountPairFromMyr(
  myr: number,
  usdMyr: number,
): { usd: number; myr: number } {
  return { usd: myr / usdMyr, myr };
}

function computeEbayResale(
  inputs: ResaleInputs,
  landedCostUsd: number,
  usdMyr: number,
): ResaleResults | null {
  if (inputs.soldPriceUsd <= 0 || usdMyr <= 0) {
    return null;
  }

  const grossSaleUsd = inputs.soldPriceUsd + inputs.buyerShippingChargedUsd;
  const totalFeePct =
    (inputs.ebayFeePct + inputs.internationalFeePct + inputs.promotedFeePct) / 100;
  const percentageFeesUsd = grossSaleUsd * totalFeePct;
  const totalFeesUsd = percentageFeesUsd + inputs.fixedOrderFeeUsd;
  const netReceivedUsd =
    grossSaleUsd -
    totalFeesUsd -
    inputs.shippingCostToBuyerUsd -
    inputs.otherCostUsd;

  const profitUsd = netReceivedUsd - landedCostUsd;
  const profit = amountPairFromUsd(profitUsd, usdMyr);
  const totalFees = amountPairFromUsd(totalFeesUsd, usdMyr);
  const netReceived = amountPairFromUsd(netReceivedUsd, usdMyr);
  const grossSale = amountPairFromUsd(grossSaleUsd, usdMyr);
  const otherCost = amountPairFromUsd(inputs.otherCostUsd, usdMyr);
  const zero = amountPairFromUsd(0, usdMyr);

  const resaleAfterPercentUsd =
    inputs.soldPriceUsd * (inputs.resaleMultiplierPercent / 100);
  const resaleAfter = amountPairFromUsd(resaleAfterPercentUsd, usdMyr);
  const profitAfterPercentUsd = resaleAfterPercentUsd - landedCostUsd;
  const profitAfter = amountPairFromUsd(profitAfterPercentUsd, usdMyr);
  const roiAfterPercent =
    landedCostUsd > 0 ? profitAfterPercentUsd / landedCostUsd : 0;

  const roiPct = landedCostUsd > 0 ? profitUsd / landedCostUsd : null;
  const marginPct = grossSaleUsd > 0 ? profitUsd / grossSaleUsd : null;

  let breakEvenSellPriceUsd: number | null = null;
  if (1 - totalFeePct > 0) {
    breakEvenSellPriceUsd =
      (landedCostUsd +
        inputs.shippingCostToBuyerUsd +
        inputs.otherCostUsd +
        inputs.fixedOrderFeeUsd) /
        (1 - totalFeePct) -
      inputs.buyerShippingChargedUsd;
  }

  const breakEven =
    breakEvenSellPriceUsd !== null
      ? amountPairFromUsd(breakEvenSellPriceUsd, usdMyr)
      : null;

  return {
    sellingMethod: "ebay",
    grossSaleUsd: grossSale.usd,
    grossSaleMyr: grossSale.myr,
    totalFeesUsd: totalFees.usd,
    totalFeesMyr: totalFees.myr,
    platformMeetupFeeUsd: zero.usd,
    platformMeetupFeeMyr: zero.myr,
    deliveryTransportCostUsd: zero.usd,
    deliveryTransportCostMyr: zero.myr,
    discountNegoAmountUsd: zero.usd,
    discountNegoAmountMyr: zero.myr,
    otherCostUsd: otherCost.usd,
    otherCostMyr: otherCost.myr,
    netReceivedUsd: netReceived.usd,
    netReceivedMyr: netReceived.myr,
    profitUsd: profit.usd,
    profitMyr: profit.myr,
    roiPct,
    marginPct,
    breakEvenSellPriceUsd: breakEven?.usd ?? null,
    breakEvenSellPriceMyr: breakEven?.myr ?? null,
    resaleAfterPercentUsd: resaleAfter.usd,
    resaleAfterPercentMyr: resaleAfter.myr,
    profitAfterPercentUsd: profitAfter.usd,
    profitAfterPercentMyr: profitAfter.myr,
    roiAfterPercent,
    verdict: getProfitVerdict(profitUsd, roiPct),
  };
}

function computePhysicalResale(
  inputs: ResaleInputs,
  landedCostMyr: number,
  usdMyr: number,
): ResaleResults | null {
  if (inputs.localSellingPriceMyr <= 0 || usdMyr <= 0) {
    return null;
  }

  const grossSaleMyr = inputs.localSellingPriceMyr;
  const platformFee = amountPairFromMyr(inputs.platformMeetupFeeMyr, usdMyr);
  const deliveryCost = amountPairFromMyr(
    inputs.deliveryTransportCostMyr,
    usdMyr,
  );
  const grossSale = amountPairFromMyr(grossSaleMyr, usdMyr);
  const zero = amountPairFromUsd(0, usdMyr);

  const netReceivedMyr =
    grossSaleMyr -
    inputs.platformMeetupFeeMyr -
    inputs.deliveryTransportCostMyr;
  const netReceived = amountPairFromMyr(netReceivedMyr, usdMyr);

  const profitMyr = netReceivedMyr - landedCostMyr;
  const profit = amountPairFromMyr(profitMyr, usdMyr);

  const resaleAfterPercentMyr =
    grossSaleMyr * (inputs.resaleMultiplierPercent / 100);
  const resaleAfter = amountPairFromMyr(resaleAfterPercentMyr, usdMyr);
  const profitAfterPercentMyr =
    resaleAfterPercentMyr -
    inputs.platformMeetupFeeMyr -
    inputs.deliveryTransportCostMyr -
    landedCostMyr;
  const profitAfter = amountPairFromMyr(profitAfterPercentMyr, usdMyr);

  const roiPct = landedCostMyr > 0 ? profitMyr / landedCostMyr : null;
  const marginPct = grossSaleMyr > 0 ? profitMyr / grossSaleMyr : null;
  const roiAfterPercent =
    landedCostMyr > 0 ? profitAfterPercentMyr / landedCostMyr : 0;

  const breakEvenLocalPriceMyr =
    landedCostMyr +
    inputs.platformMeetupFeeMyr +
    inputs.deliveryTransportCostMyr;
  const breakEven = amountPairFromMyr(breakEvenLocalPriceMyr, usdMyr);

  return {
    sellingMethod: "physical",
    grossSaleUsd: grossSale.usd,
    grossSaleMyr: grossSale.myr,
    totalFeesUsd: zero.usd,
    totalFeesMyr: zero.myr,
    platformMeetupFeeUsd: platformFee.usd,
    platformMeetupFeeMyr: platformFee.myr,
    deliveryTransportCostUsd: deliveryCost.usd,
    deliveryTransportCostMyr: deliveryCost.myr,
    discountNegoAmountUsd: zero.usd,
    discountNegoAmountMyr: zero.myr,
    otherCostUsd: zero.usd,
    otherCostMyr: zero.myr,
    netReceivedUsd: netReceived.usd,
    netReceivedMyr: netReceived.myr,
    profitUsd: profit.usd,
    profitMyr: profit.myr,
    roiPct,
    marginPct,
    breakEvenSellPriceUsd: breakEven.usd,
    breakEvenSellPriceMyr: breakEven.myr,
    resaleAfterPercentUsd: resaleAfter.usd,
    resaleAfterPercentMyr: resaleAfter.myr,
    profitAfterPercentUsd: profitAfter.usd,
    profitAfterPercentMyr: profitAfter.myr,
    roiAfterPercent,
    verdict: getProfitVerdict(profit.usd, roiPct),
  };
}

export function computeResale(
  inputs: ResaleInputs,
  buyingResults: BuyingResults,
  usdMyr: number,
): ResaleResults | null {
  if (inputs.sellingMethod === "physical") {
    return computePhysicalResale(
      inputs,
      buyingResults.landedCostMyr,
      usdMyr,
    );
  }

  return computeEbayResale(inputs, buyingResults.landedCostUsd, usdMyr);
}
