/** Server-only Telegram Bot API sender. Import from Edge Functions only. */

export type TelegramChatId = string | number;

export type TelegramSendResult =
  | {
      success: true;
      chatId: TelegramChatId;
      messageId: number;
    }
  | {
      success: false;
      chatId: TelegramChatId;
      error: {
        type: "configuration" | "validation" | "timeout" | "network" | "telegram_api";
        message: string;
        httpStatus?: number;
        telegramErrorCode?: number;
        telegramDescription?: string;
        retryAfterSeconds?: number;
      };
    };

interface TelegramApiResponse {
  ok?: boolean;
  result?: { message_id?: number };
  error_code?: number;
  description?: string;
  parameters?: { retry_after?: number };
}

const TELEGRAM_API_BASE = "https://api.telegram.org";
const TELEGRAM_MESSAGE_LIMIT = 4096;
const DEFAULT_TIMEOUT_MS = 10_000;

function failure(
  chatId: TelegramChatId,
  type: TelegramSendResult extends { success: false; error: infer E }
    ? E extends { type: infer T } ? T : never
    : never,
  message: string,
  details: Partial<Extract<TelegramSendResult, { success: false }>["error"]> = {},
): TelegramSendResult {
  return { success: false, chatId, error: { type, message, ...details } };
}

/**
 * Sends one HTML-formatted Telegram message without allowing notification
 * failures to throw into the calling business flow.
 */
export async function sendTelegramMessage(
  chatId: TelegramChatId,
  htmlText: string,
): Promise<TelegramSendResult> {
  try {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN")?.trim();
    if (!token) {
      return failure(chatId, "configuration", "TELEGRAM_BOT_TOKEN is not configured");
    }

    const normalizedChatId = String(chatId).trim();
    const normalizedText = typeof htmlText === "string" ? htmlText.trim() : "";
    if (!normalizedChatId) {
      return failure(chatId, "validation", "A Telegram chat ID is required");
    }
    if (!normalizedText) {
      return failure(chatId, "validation", "Telegram message text is required");
    }
    if (normalizedText.length > TELEGRAM_MESSAGE_LIMIT) {
      return failure(
        chatId,
        "validation",
        `Telegram message text exceeds ${TELEGRAM_MESSAGE_LIMIT} characters`,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    let response: Response;

    try {
      response = await fetch(
        `${TELEGRAM_API_BASE}/bot${encodeURIComponent(token)}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: normalizedChatId,
            text: normalizedText,
            parse_mode: "HTML",
          }),
          signal: controller.signal,
        },
      );
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      return failure(
        chatId,
        timedOut ? "timeout" : "network",
        timedOut ? "Telegram request timed out" : "Telegram request failed",
      );
    } finally {
      clearTimeout(timeout);
    }

    let payload: TelegramApiResponse = {};
    try {
      payload = await response.json() as TelegramApiResponse;
    } catch {
      // Preserve the HTTP status below even if Telegram returns a malformed body.
    }

    const messageId = payload.result?.message_id;
    if (!response.ok || payload.ok !== true || typeof messageId !== "number") {
      console.error("Telegram send failed", {
        httpStatus: response.status,
        telegramErrorCode: payload.error_code,
        telegramDescription: payload.description,
      });
      return failure(chatId, "telegram_api", "Telegram rejected the message", {
        httpStatus: response.status,
        telegramErrorCode: payload.error_code,
        telegramDescription: payload.description,
        retryAfterSeconds: payload.parameters?.retry_after,
      });
    }

    return { success: true, chatId, messageId };
  } catch (error) {
    console.error("Unexpected Telegram sender failure", error);
    return failure(chatId, "network", "Unexpected Telegram sender failure");
  }
}

/** Sends the same HTML message to multiple recipients and returns every result. */
export async function sendTelegramMessages(
  chatIds: readonly TelegramChatId[],
  htmlText: string,
): Promise<TelegramSendResult[]> {
  return await Promise.all(chatIds.map((chatId) => sendTelegramMessage(chatId, htmlText)));
}