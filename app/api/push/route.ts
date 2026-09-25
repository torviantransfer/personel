import { NextResponse, type NextRequest } from "next/server";
import { isValidSubscription, removeSubscription, saveSubscription } from "@/lib/push";
import { createClient, getUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function authorize(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return null;
  return getUserId(await createClient());
}

/** Bu cihazın bildirim aboneliğini kaydeder. */
export async function POST(request: NextRequest) {
  const userId = await authorize(request);
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const sub = await request.json().catch(() => null);
  if (!isValidSubscription(sub)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await saveSubscription(userId, sub);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/** Bu cihazın aboneliğini siler (çıkış yaparken). */
export async function DELETE(request: NextRequest) {
  const userId = await authorize(request);
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  await removeSubscription(userId, body.endpoint);
  return NextResponse.json({ ok: true });
}
