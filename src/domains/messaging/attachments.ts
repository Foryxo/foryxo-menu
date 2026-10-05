export const MAX_CHAT_ATTACHMENTS = 6;

export function canAddChatAttachment(count: number): boolean {
  return count < MAX_CHAT_ATTACHMENTS;
}
