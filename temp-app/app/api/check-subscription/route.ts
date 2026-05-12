import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getSubscriptionByAny,
  isSubscriptionActive,
  isSubscriptionExpired,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Get immediate session context (extremely fast)
    const { userId } = await auth();
    
    // 2. Extract passed params sent from client
    const emailParam = req.nextUrl.searchParams.get("email");
    const phoneParam = req.nextUrl.searchParams.get("phone");

    // 3. High-performance combined hit (ONE database query)
    const sub = await getSubscriptionByAny({
      userId: userId,
      email: emailParam,
      phone: phoneParam
    });

    // Prepare response structure
    const responsePayload = {
      active: isSubscriptionActive(sub),
      expired: isSubscriptionExpired(sub),
      subscription: sub
        ? {
            name: sub.name,
            email: sub.email,
            phone: sub.phone,
            expires_at: sub.expires_at,
            amount: sub.amount,
            user_id: sub.user_id,
          }
        : null,
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("[api/check-subscription] optimization-route-error:", err);
    return NextResponse.json({ active: false, expired: false, subscription: null });
  }
}
