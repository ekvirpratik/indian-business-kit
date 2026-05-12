import { NextRequest, NextResponse } from "next/server";

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

const CASHFREE_API_VERSION = "2023-08-01";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customerName, customerEmail, customerPhone, coupon, userId } = body;

    // Validate required fields
    if (!amount || !customerPhone) {
      return NextResponse.json(
        { error: "amount and customerPhone are required" },
        { status: 400 }
      );
    }

    // Generate unique order ID using timestamp + random string
    const orderId = `IBK_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${customerPhone}`,
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "customer@example.com",
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payment-callback?order_id={order_id}`,
        notify_url: process.env.CASHFREE_WEBHOOK_URL || "", // Empty for now - add after deployment
        payment_methods: "cc,dc,nb,upi,app",
      },
      order_tags: {
        coupon_applied: coupon || "none",
        source: "landing_page",
        clerk_user_id: userId || "none",
      },
    };

    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_APP_SECRET!,
        "x-api-version": CASHFREE_API_VERSION,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree order creation failed:", data);
      return NextResponse.json(
        { error: data.message || "Failed to create order" },
        { status: response.status }
      );
    }

    // Return only what the frontend needs
    return NextResponse.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      amount: data.order_amount,
    });
  } catch (error) {
    console.error("create-order API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
