import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSubscription } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      userId,
    } = body;

    // Validate missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required signature verification fields" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("Razorpay secret key is missing in environment variables");
      return NextResponse.json(
        { error: "Payment verification credentials are not configured" },
        { status: 500 }
      );
    }

    // Verify cryptographic signature
    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(signaturePayload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn("Razorpay payment signature mismatch!");
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 400 }
      );
    }

    // Signature matches! Persist the subscription in Supabase
    await createSubscription({
      order_id: razorpay_order_id,
      email: customerEmail || "",
      phone: customerPhone || "",
      name: customerName || "Customer",
      amount: amount || 0, // amount in INR
      user_id: userId && userId !== "none" ? userId : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("verify-payment API error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
  