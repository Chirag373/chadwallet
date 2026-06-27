import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.JUPITER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Jupiter API key is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      signedTransaction?: unknown;
      requestId?: unknown;
    };

    if (
      typeof body.signedTransaction !== "string" ||
      body.signedTransaction.length === 0 ||
      typeof body.requestId !== "string" ||
      body.requestId.length === 0
    ) {
      return NextResponse.json({ error: "Invalid swap execution payload." }, { status: 400 });
    }

    const response = await fetch("https://api.jup.ag/swap/v2/execute", {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        signedTransaction: body.signedTransaction,
        requestId: body.requestId,
      }),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      console.error("Jupiter execute error:", response.status, responseBody);
      return NextResponse.json(
        { error: `Jupiter execution failed (${response.status}).` },
        { status: response.status },
      );
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Jupiter execute proxy error:", error);
    return NextResponse.json({ error: "Jupiter execution service is unavailable." }, { status: 502 });
  }
}
