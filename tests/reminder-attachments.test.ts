import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSignedUrl,
  downloadReceiptFile,
} from "@/lib/storage/receipt-storage";
import { selectReminderAttachment } from "@/lib/notifications/reminder-attachments";

vi.mock("@/lib/storage/receipt-storage", () => ({
  createSignedUrl: vi.fn(),
  downloadReceiptFile: vi.fn(),
}));

function createSupabaseMock(data: unknown) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };

  return {
    from: vi.fn(() => builder),
    builder,
  };
}

describe("reminder attachment selection", () => {
  beforeEach(() => {
    vi.mocked(createSignedUrl).mockReset();
    vi.mocked(downloadReceiptFile).mockReset();
  });

  it("returns null when the receipt has no attachment", async () => {
    const supabase = createSupabaseMock(null);

    await expect(
      selectReminderAttachment(supabase as never, "receipt-1"),
    ).resolves.toBeNull();
  });

  it("downloads a safe-sized attachment for direct email delivery", async () => {
    const file = Buffer.from("receipt image");
    vi.mocked(downloadReceiptFile).mockResolvedValue(file);
    const supabase = createSupabaseMock({
      storage_path: "user/receipt/photo.png",
      original_filename: "photo.png",
      mime_type: "image/png",
      size_bytes: 1024,
    });

    await expect(
      selectReminderAttachment(supabase as never, "receipt-1"),
    ).resolves.toEqual({
      mode: "attachment",
      filename: "photo.png",
      contentType: "image/png",
      content: file,
    });
  });

  it("uses a signed link when the attachment is too large for email", async () => {
    vi.mocked(createSignedUrl).mockResolvedValue("https://signed.example/file");
    const supabase = createSupabaseMock({
      storage_path: "user/receipt/large.pdf",
      original_filename: "large.pdf",
      mime_type: "application/pdf",
      size_bytes: 12 * 1024 * 1024,
    });

    await expect(
      selectReminderAttachment(supabase as never, "receipt-1"),
    ).resolves.toMatchObject({
      mode: "link",
      filename: "large.pdf",
      contentType: "application/pdf",
      signedUrl: "https://signed.example/file",
    });
  });

  it("falls back to a signed link when download fails", async () => {
    vi.mocked(downloadReceiptFile).mockRejectedValue(new Error("download failed"));
    vi.mocked(createSignedUrl).mockResolvedValue("https://signed.example/fallback");
    const supabase = createSupabaseMock({
      storage_path: "user/receipt/photo.jpg",
      original_filename: null,
      mime_type: "image/jpeg",
      size_bytes: 2048,
    });

    await expect(
      selectReminderAttachment(supabase as never, "receipt-1"),
    ).resolves.toMatchObject({
      mode: "link",
      filename: "receipt-attachment",
      signedUrl: "https://signed.example/fallback",
    });
  });
});
