import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  try {
    const res = await fetch(`https://quote-api.jup.ag/v6/quote${search}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Jupiter quote proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch quote from Jupiter' }, { status: 500 });
  }
}
