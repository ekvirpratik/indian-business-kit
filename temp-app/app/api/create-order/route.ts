import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

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

    // Razorpay minimum amount is 1 INR (100 paise)
    if (amount < 1) {
      return NextResponse.json(
        { error: "Amount must be at least 1 INR" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys are missing in environment variables");
      return NextResponse.json(
        { error: "Payment gateway credentials are not configured" },
        { status: 500 }
      );
    }

    // Initialize Razorpay client
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Generate unique internal receipt ID
    const receiptId = `IBK_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Create order on Razorpay
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert INR Rupees to paise, ensure integer
      currency: "INR",
      receipt: receiptId,
      notes: {
        customerName: customerName || "Customer",
        customerEmail: customerEmail || "customer@example.com",
        customerPhone: customerPhone,
        coupon: coupon || "none",
        userId: userId || "none",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: unknown) {
    console.error("create-order API error:", error);
    const err = error as { statusCode?: number; message?: string };
    
    // Check for Razorpay authentication error
    if (err.statusCode === 401 || (err.message && err.message.includes("401"))) {
      return NextResponse.json(
        { error: "Invalid API credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
