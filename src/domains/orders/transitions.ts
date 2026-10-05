export const ORDER_STATUS_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  // `placed` is retained for imported and pre-confirmation legacy orders.
  placed: ["accepted", "rejected"],
  awaiting_confirmation: ["accepted", "rejected"],
  accepted: ["preparing", "rejected"],
  preparing: ["ready"],
  ready: ["completed"],
};

export function canTransitionOrderStatus(current: string, next: string): boolean {
  return ORDER_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}
