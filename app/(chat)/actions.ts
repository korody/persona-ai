"use server";

import type { ChatMessage } from "@/lib/types";

export async function deleteTrailingMessages({
  id,
}: {
  id: string;
}): Promise<ChatMessage[]> {
  // Esta função seria implementada para deletar mensagens do banco
  // Por enquanto retorna array vazio
  return [];
}
