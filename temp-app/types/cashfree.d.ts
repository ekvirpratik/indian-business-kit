declare module "@cashfreepayments/cashfree-js" {
  interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | string;
  }

  interface CashfreeInstance {
    checkout(options: CheckoutOptions): void;
  }

  interface LoadOptions {
    mode: "sandbox" | "production";
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>;
}
