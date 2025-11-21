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

export async function saveChatModelAsCookie(model: string) {
  // Salvar preferência de modelo em cookie
  // Por enquanto apenas retorna
  return;
}

export async function saveVisibilityAsCookie(visibility: string) {
  // Salvar preferência de visibilidade em cookie
  return;
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: string;
}) {
  // Atualizar visibilidade da conversa no banco
  return;
}
