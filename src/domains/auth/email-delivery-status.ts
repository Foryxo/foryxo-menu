import { AsyncLocalStorage } from "node:async_hooks";

type DeliveryState = { failure: "rate_limited" | "delivery_failed" | null };

const deliveryState = new AsyncLocalStorage<DeliveryState>();

/** Better Auth swallows send callback errors; keep the outcome request-scoped. */
export async function captureEmailOtpDelivery<T>(run: () => Promise<T>) {
  const state: DeliveryState = { failure: null };
  const result = await deliveryState.run(state, run);
  return { result, failure: state.failure };
}

export function recordEmailOtpDeliveryFailure(error: unknown) {
  const state = deliveryState.getStore();
  if (state) {
    state.failure = error instanceof Error && error.message === "RATE_LIMITED"
      ? "rate_limited"
      : "delivery_failed";
  }
}
