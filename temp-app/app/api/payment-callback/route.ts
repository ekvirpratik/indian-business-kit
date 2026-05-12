import { NextRequest, NextResponse } from "next/server";
import { createSubscription, getSubscriptionByOrderId } from "@/lib/subscriptions";

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.redirect(`${BASE_URL}/?payment=failed&reason=no_order`);
  }

  try {
    // 1. Fetch order details from Cashfree to confirm payment status
    const cfRes = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_APP_SECRET!,
        "x-api-version": "2023-08-01",
      },
      cache: "no-store",
    });

    if (!cfRes.ok) {
      console.error("Cashfree order fetch failed for:", orderId);
      return NextResponse.redirect(
        `${BASE_URL}/?payment=failed&reason=verify_failed&order_id=${orderId}`
      );
    }

    const order = await cfRes.json();

    // 2. Only save if payment is PAID
    if (order.order_status !== "PAID") {
      console.warn("Payment not completed for order:", orderId, order.order_status);
      return NextResponse.redirect(
        `${BASE_URL}/pricing?payment=cancelled&order_id=${orderId}`
      );
    }

    // 3. Check if we already saved this subscription (idempotent)
    const existing = await getSubscriptionByOrderId(orderId);
    if (!existing) {
      // Extract customer details from the Cashfree order
      const customer = order.customer_details || {};
      const tags = order.order_tags || {};
      const clerkUserId = tags.clerk_user_id && tags.clerk_user_id !== "none" ? tags.clerk_user_id : null;

      await createSubscription({
        order_id: orderId,
        email: customer.customer_email || "",
        phone: customer.customer_phone || "",
        name: customer.customer_name || "Customer",
        amount: order.order_amount,
        user_id: clerkUserId || undefined,
      });
    }

    // 4. Redirect to homepage with success flags — triggers popup + confetti
    return NextResponse.redirect(
      `${BASE_URL}/?payment=success&order_id=${orderId}`
    );
  } catch (err) {
    console.error("payment-callback error:", err);
    return NextResponse.redirect(
      `${BASE_URL}/?payment=failed&reason=server_error`
    );
  }
}
