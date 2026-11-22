import { describe, expect, it } from "vitest";
import { canPublishHighlight } from "../../supabase/functions/admin-highlights/logic";
const now = Date.parse("2026-11-22T04:00:00Z");
const available = { is_embeddable: true, availability_status: "available", api_data_expires_at: "2026-11-23T04:00:00Z" };
describe("admin highlight publication", () => {
  it("permits an available, fresh video from an enabled official source", () => expect(canPublishHighlight(available, true, now)).toBe(true));
  it("blocks unavailable or nonembeddable videos", () => {
    expect(canPublishHighlight({ ...available, is_embeddable: false }, true, now)).toBe(false);
    expect(canPublishHighlight({ ...available, availability_status: "unavailable" }, true, now)).toBe(false);
  });
  it("blocks expired metadata", () => expect(canPublishHighlight({ ...available, api_data_expires_at: "2026-11-22T03:59:59Z" }, true, now)).toBe(false));
  it("blocks disabled sources", () => expect(canPublishHighlight(available, false, now)).toBe(false));
});