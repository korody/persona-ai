import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },

  /*
   * Free tier
   */
  free: {
    maxMessagesPerDay: 50,
    availableChatModelIds: ["chat-model"],
  },

  /*
   * Discipulo tier
   */
  discipulo: {
    maxMessagesPerDay: 200,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },

  /*
   * Mestre tier
   */
  mestre: {
    maxMessagesPerDay: 999999,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
};
