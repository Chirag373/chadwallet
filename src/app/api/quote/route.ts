import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

const JUPITER_ORDER_URL = "https://api.jup.ag/swap/v2/order";

function isPublicKey(value: string | null): value is string {
  if (!value) return false;
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.JUPITER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Jupiter API key is not configured." },
      { status: 503 },
    );
  }

  const inputMint = request.nextUrl.searchParams.get("inputMint");
  const outputMint = request.nextUrl.searchParams.get("outputMint");
  const amount = request.nextUrl.searchParams.get("amount");
  const taker = request.nextUrl.searchParams.get("taker");
  const slippageBps = request.nextUrl.searchParams.get("slippageBps");

  if (!isPublicKey(inputMint) || !isPublicKey(outputMint) || !amount || !/^\d+$/.test(amount)) {
    return NextResponse.json({ error: "Invalid quote parameters." }, { status: 400 });
  }

  if (taker && !isPublicKey(taker)) {
    return NextResponse.json({ error: "Invalid Solana wallet address." }, { status: 400 });
  }

  const params = new URLSearchParams({ inputMint, outputMint, amount });
  if (taker) params.set("taker", taker);
  if (slippageBps && /^\d+$/.test(slippageBps)) {
    params.set("slippageBps", slippageBps);
  }

  try {
    const response = await fetch(`${JUPITER_ORDER_URL}?${params.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    const body = await response.text();
    if (!response.ok) {
      console.error("Jupiter order error:", response.status, body);
      return NextResponse.json(
        { error: `Jupiter order failed (${response.status}).` },
        { status: response.status },
      );
    }

    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Jupiter order proxy error:", error);
    return NextResponse.json({ error: "Jupiter order service is unavailable." }, { status: 502 });
  }
}
