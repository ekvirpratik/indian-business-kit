import { createClient } from "@supabase/supabase-js";

// Initialize a singleton client instance to reuse TCP connections across requests
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use service role key for server-side admin operations (bypass RLS)
function getAdminClient() {
  return supabaseAdmin;
}

export interface Subscription {
  id: string;
  user_id: string | null;
  email: string;
  phone: string;
  name: string;
  order_id: string;
  amount: number;
  active: boolean;
  expires_at: string;
  created_at: string;
}

/**
 * Create a new subscription record in the database after successful payment.
 */
export async function createSubscription(data: {
  email: string;
  phone: string;
  name: string;
  order_id: string;
  amount: number;
  user_id?: string;
}) {
  const supabase = getAdminClient();

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

  const { data: result, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: data.user_id ?? null,
        email: data.email,
        phone: data.phone,
        name: data.name,
        order_id: data.order_id,
        amount: data.amount,
        active: true,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "order_id" }
    )
    .select();

  if (error) {
    console.error("createSubscription error:", error);
    throw error;
  }
  
  if (!result || result.length === 0) {
    throw new Error("Failed to create subscription - no result returned");
  }
  
  return result[0] as Subscription;
}

/**
 * Optimized high-performance query to find active subscription by ANY unique identifier in ONE request.
 * Significantly reduces latency versus sequential independent DB hits.
 */
export async function getSubscriptionByAny(params: {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<Subscription | null> {
  const { userId, email, phone } = params;
  
  // Build the logical OR condition for Supabase
  const orClauses: string[] = [];
  if (userId) orClauses.push(`user_id.eq.${userId}`);
  if (email) orClauses.push(`email.ilike.${email}`);
  if (phone) orClauses.push(`phone.eq.${phone}`);
  
  if (orClauses.length === 0) return null;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .or(orClauses.join(","))
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getSubscriptionByAny error:", error);
    return null;
  }
  
  if (!data || data.length === 0) return null;
  return data[0] as Subscription;
}

/**
 * Get subscription by Clerk user ID.
 */
export async function getSubscriptionByUserId(
  userId: string
): Promise<Subscription | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getSubscriptionByUserId error:", error);
    return null;
  }
  
  if (!data || data.length === 0) return null;
  return data[0] as Subscription;
}

/**
 * Get subscription by email.
 */
export async function getSubscriptionByEmail(
  email: string
): Promise<Subscription | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getSubscriptionByEmail error:", error);
    return null;
  }
  
  if (!data || data.length === 0) return null;
  return data[0] as Subscription;
}

/**
 * Get subscription by phone number (used for client-side check via server action/API).
 */
export async function getSubscriptionByPhone(
  phone: string
): Promise<Subscription | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getSubscriptionByPhone error:", error);
    return null;
  }
  
  if (!data || data.length === 0) return null;
  return data[0] as Subscription;
}

/**
 * Get subscription by order ID.
 */
export async function getSubscriptionByOrderId(
  orderId: string
): Promise<Subscription | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("order_id", orderId)
    .limit(1);

  if (error) {
    console.error("getSubscriptionByOrderId error:", error);
    return null;
  }
  
  if (!data || data.length === 0) return null;
  return data[0] as Subscription;
}

/**
 * Check if a subscription is currently active (exists and not expired).
 */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub || !sub.active) return false;
  return new Date(sub.expires_at) > new Date();
}

/**
 * Check if a subscription is expired (exists but past expiry date).
 */
export function isSubscriptionExpired(sub: Subscription | null): boolean {
  if (!sub) return false;
  return new Date(sub.expires_at) <= new Date();
}
