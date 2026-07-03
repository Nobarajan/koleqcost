import { NextResponse } from "next/server";

export const revalidate = 3600;

type FreeApiResponse = {
  result: string;
  time_last_update_utc: string;
  rates: {
    MYR?: number;
  };
};

type KeyedApiResponse = {
  result: string;
  time_last_update_utc: string;
  conversion_rates: {
    MYR?: number;
  };
};

type RatesPayload = {
  usdMyr: number;
  lastUpdatedUtc: string;
  source: "live";
};

async function fetchFromFreeApi(): Promise<RatesPayload> {
  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch live exchange rates.");
  }

  const data = (await response.json()) as FreeApiResponse;

  if (data.result !== "success" || !data.rates.MYR) {
    throw new Error("Exchange rate API returned an invalid response.");
  }

  return {
    usdMyr: data.rates.MYR,
    lastUpdatedUtc: data.time_last_update_utc,
    source: "live",
  };
}

async function fetchFromKeyedApi(apiKey: string): Promise<RatesPayload> {
  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
    { next: { revalidate } },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch live exchange rates.");
  }

  const data = (await response.json()) as KeyedApiResponse;

  if (data.result !== "success" || !data.conversion_rates.MYR) {
    throw new Error("Exchange rate API returned an invalid response.");
  }

  return {
    usdMyr: data.conversion_rates.MYR,
    lastUpdatedUtc: data.time_last_update_utc,
    source: "live",
  };
}

export async function GET() {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const rates = apiKey
      ? await fetchFromKeyedApi(apiKey)
      : await fetchFromFreeApi();

    return NextResponse.json(rates);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch exchange rates.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

