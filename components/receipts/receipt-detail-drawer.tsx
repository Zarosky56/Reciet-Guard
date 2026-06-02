"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  X, 
  Download, 
  Edit3, 
  Trash2, 
  FileText, 
  Calendar, 
  Image as ImageIcon,
  Check,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";
import { CATEGORIES, getCategoryStyle, type ReceiptCategory } from "@/lib/receipts/category";

interface ReceiptDetailDrawerProps {
  open: boolean;
  receipt: ReceiptWithUrgency | null;
  onClose: () => void;
  onEdit: (receipt: ReceiptWithUrgency) => void;
  onDelete: (receipt: ReceiptWithUrgency) => void;
  onStatusChange: (receipt: ReceiptWithUrgency, status: ReceiptStatus) => void;
  onCategoryChange?: (receipt: ReceiptWithUrgency, category: string) => void;
}

const standardEase = [0.2, 0, 0, 1] as const;

export function ReceiptDetailDrawer({
  open,
  receipt,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onCategoryChange
}: ReceiptDetailDrawerProps) {
  const [catSelectorOpen, setCatSelectorOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "document">("details");

  // Track responsive screen size
  useEffect(() => {
    if (!window.matchMedia) {
      setIsMobile(window.innerWidth <= 768);
      return;
    }

    const media = window.matchMedia("(max-width: 768px)");
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset tab to details when drawer opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open, receipt]);

  if (!receipt) return null;

  // Determine category and style
  const category = receipt.category || (
    receipt.id.charCodeAt(0) % 5 === 0 ? "Electronics & Tech" :
    receipt.id.charCodeAt(0) % 5 === 1 ? "Transport" :
    receipt.id.charCodeAt(0) % 5 === 2 ? "Essential Living" :
    receipt.id.charCodeAt(0) % 5 === 3 ? "Lifestyle & Leisure" :
    "Travel & Lodging"
  );
  const catStyle = getCategoryStyle(category);
  const CatIcon = catStyle.icon;

  // Attachment previews
  const hasRealAttachment = receipt.attachments && receipt.attachments.length > 0;
  const showDummyThumb = receipt.id.charCodeAt(1) % 2 === 0;
  
  // Use a mock document visual for display
  const attachmentUrl = (hasRealAttachment && receipt.attachments)
    ? receipt.attachments[0].signed_url
    : showDummyThumb
      ? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&auto=format&fit=crop"
      : null;

  const isPdf = (hasRealAttachment && receipt.attachments)
    ? receipt.attachments[0].mime_type === "application/pdf"
    : receipt.id.charCodeAt(2) % 3 === 0;

  const originalFilename = (hasRealAttachment && receipt.attachments)
    ? receipt.attachments[0].original_filename
    : isPdf ? "receipt_invoice_10928.pdf" : "receipt_target_purchase.png";

  const fileSize = (hasRealAttachment && receipt.attachments)
    ? `${(receipt.attachments[0].size_bytes / 1024).toFixed(1)} KB`
    : "142.4 KB";

  function handleCategorySelect(catName: ReceiptCategory) {
    if (onCategoryChange && receipt) {
      onCategoryChange(receipt, catName);
    }
    setCatSelectorOpen(false);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="detail-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={onClose}
          role="presentation"
        >
          <motion.aside
            key="detail-drawer-panel"
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: standardEase }}
            style={isMobile ? { height: "92vh", maxHeight: "92vh" } : { maxHeight: "85vh" }}
            className="relative w-full max-w-4xl overflow-hidden rounded-t-2xl border border-border bg-surface text-text-primary sm:rounded-2xl shadow-2xl flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 relative z-10">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-canvas text-accent-primary">
                  <FileText className="size-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-text-primary">
                    Receipt Details
                  </h2>
                  <p className="text-xs text-text-muted">
                    Uploaded and parsed receipt document logs
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close details"
                className="text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Mobile Tab Bar (Floating Metallic Capsule) */}
            {isMobile && (
              <div className="flex bg-canvas border-b border-border p-1 gap-1 relative z-10">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={cn(
                    "flex-grow py-2.5 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    activeTab === "details"
                      ? "bg-surface text-text-primary border border-border shadow-sm"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <FileText className="size-3.5" />
                  <span>Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("document")}
                  className={cn(
                    "flex-grow py-2.5 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    activeTab === "document"
                      ? "bg-surface text-text-primary border border-border shadow-sm"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <ImageIcon className="size-3.5" />
                  <span>Document Preview</span>
                </button>
              </div>
            )}

            {/* Content area: Split Layout (Tabbed on Mobile) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border relative z-10">
              
              {/* LEFT COLUMN: Original Document Preview */}
              {(!isMobile || activeTab === "document") && (
                <div className="p-6 bg-canvas flex flex-col justify-between items-center gap-5">
                  <div className="w-full text-left">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                      Original Document
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                      {isPdf ? (
                        <div className="size-10 rounded-lg bg-danger/10 flex items-center justify-center text-danger shrink-0 border border-danger/20">
                          <FileText className="size-5" />
                        </div>
                      ) : (
                        <div className="size-10 rounded-lg bg-info/10 flex items-center justify-center text-info shrink-0 border border-info/20">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {originalFilename}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                          <span className="bg-canvas border border-border px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider text-text-muted font-mono">
                            {isPdf ? "PDF Document" : "Image File"}
                          </span>
                          <span>{fileSize}</span>
                        </p>
                      </div>
                      
                      {/* Action Download */}
                      {attachmentUrl && (
                        <a
                          href={attachmentUrl}
                          download={originalFilename ?? "receipt"}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors border border-border shrink-0"
                          title="Download file"
                        >
                          <Download className="size-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Preview screen */}
                  <div 
                    style={isMobile ? { minHeight: "260px" } : { minHeight: "340px" }}
                    className="w-full flex-1 border border-border rounded-xl overflow-hidden bg-surface relative flex items-center justify-center shadow-inner group"
                  >
                    {attachmentUrl ? (
                      isPdf ? (
                        /* PDF mock presentation */
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/5">
                          <div 
                            style={{ height: "85%" }}
                            className="w-4/5 bg-white border border-border shadow-2xl rounded-lg p-5 flex flex-col justify-between font-mono leading-none select-none text-slate-850 pointer-events-none"
                          >
                            <div className="flex justify-between border-b border-slate-100 pb-3" style={{ fontSize: "6px" }}>
                              <span className="font-bold text-slate-900">INVOICE {"#"}9283</span> {/* allow:color */}
                              <span>Walmart Inc</span>
                            </div>
                            <div className="space-y-2 py-4 flex-1">
                              <div className="flex justify-between font-bold pb-1.5 border-b border-slate-100 text-slate-900" style={{ fontSize: "8px" }}>
                                <span>ITEM</span>
                                <span>AMT</span>
                              </div>
                              <div className="flex justify-between" style={{ fontSize: "6px" }}>
                                <span>Sony WH-1000XM4 Headp...</span>
                                <span>$250.00</span>
                              </div>
                              <div className="flex justify-between" style={{ fontSize: "6px" }}>
                                <span>Aux Coiled Audio Cable</span>
                                <span>$10.00</span>
                              </div>
                              <div className="flex justify-between" style={{ fontSize: "6px" }}>
                                <span>VAT TAX 7.2%</span>
                                <span>$18.00</span>
                              </div>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-3 font-bold text-slate-900" style={{ fontSize: "8px" }}>
                              <span>TOTAL PAID</span>
                              <span>$278.00</span>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-surface text-text-primary hover:bg-surface-hover text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg border border-border"
                            >
                              Open PDF Viewer
                            </a>
                          </div>
                        </div>
                      ) : (
                        /* Image preview */
                        <img
                          src={attachmentUrl}
                          alt="Receipt preview"
                          style={isMobile ? { maxHeight: "320px" } : { maxHeight: "380px" }}
                          className="w-full h-full object-contain rounded-lg p-2"
                        />
                      )
                    ) : (
                      /* Fallback when no document attached */
                      <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
                        <div className="size-12 rounded-xl bg-canvas flex items-center justify-center mb-3 border border-border">
                          <FileText className="size-6 text-text-muted" />
                        </div>
                        <p className="text-xs font-bold text-text-primary">No Document Preview</p>
                        <p className="text-xs max-w-xs mt-1 text-text-muted">
                          This item was created manually or parsed without saving a document.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RIGHT COLUMN: Extracted Metadata */}
              {(!isMobile || activeTab === "details") && (
                <div className="p-6 flex flex-col justify-between gap-6 bg-surface">
                  
                  {/* Upper fields */}
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {/* Dynamic Editable Title - Notion bold style */}
                        <h3 className="text-xl font-extrabold text-text-primary leading-tight tracking-tight">
                          {receipt.item_name ?? "Unnamed item"}
                        </h3>
                        <p className="text-xs text-text-muted mt-1.5 flex items-center flex-wrap gap-1">
                          purchased from
                          <span className="font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono text-xs select-none">
                            {receipt.store_name ?? "Unknown store"}
                          </span>
                        </p>
                      </div>

                      {/* Category pill editor drop-down */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setCatSelectorOpen(!catSelectorOpen)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-md bg-canvas border-border text-text-primary hover:bg-surface-hover"
                          )}
                        >
                          <CatIcon className="size-3.5 text-accent-primary" />
                          <span>{category}</span>
                          <ChevronDown className="size-3 text-text-muted shrink-0 ml-0.5" />
                        </button>

                        {catSelectorOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setCatSelectorOpen(false)} 
                            />
                            <div className="absolute right-0 mt-2 z-40 w-48 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-2xl focus:outline-none">
                              {Object.values(CATEGORIES).map((cat) => (
                                <button
                                  key={cat.name}
                                  type="button"
                                  onClick={() => handleCategorySelect(cat.name)}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors text-left",
                                    category === cat.name
                                      ? "bg-accent-tint text-text-primary font-bold"
                                      : "text-text-muted hover:bg-surface-hover"
                                  )}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <cat.icon className="size-3.5" />
                                    <span>{cat.name}</span>
                                  </div>
                                  {category === cat.name && <Check className="size-3 text-text-primary shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-canvas border border-border flex items-center justify-between shadow-sm">
                      <span className="text-xs text-text-muted font-bold tracking-wider uppercase">Price Paid</span>
                      <span className="font-mono text-2xl font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 tracking-tight">
                        {receipt.price !== null
                          ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: receipt.currency ?? "USD",
                            }).format(receipt.price)
                          : "—"}
                      </span>
                    </div>

                    <div className="bg-canvas p-4 rounded-xl border border-border space-y-3.5">
                      <h4 className="text-xs font-bold tracking-widest text-text-muted uppercase flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-accent-primary" />
                        <span>Protection Timeline</span>
                      </h4>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs border border-border bg-canvas/30 px-3 py-2 rounded-lg">
                          <span className="text-text-secondary font-medium">Purchase Date</span>
                          <span className="font-semibold text-text-primary font-mono bg-surface px-2.5 py-0.5 rounded border border-border">{receipt.purchase_date ?? "—"}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs border border-border bg-canvas/30 px-3 py-2 rounded-lg">
                          <span className="text-text-secondary font-medium">Return Deadline</span>
                          <span className="font-semibold text-text-primary font-mono bg-surface px-2.5 py-0.5 rounded border border-border">{receipt.return_deadline ?? "—"}</span>
                        </div>

                        {receipt.warranty_deadline && (
                          <div className="flex items-center justify-between text-xs border border-border bg-canvas/30 px-3 py-2 rounded-lg">
                            <span className="text-text-secondary font-medium">Warranty Expiration</span>
                            <span className="font-semibold text-text-primary font-mono bg-surface px-2.5 py-0.5 rounded border border-border">{receipt.warranty_deadline}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {receipt.status === "active" && receipt.days_remaining !== null && (
                      <div className={cn(
                        "p-4 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm transition-all duration-300",
                        receipt.days_remaining < 0
                          ? "bg-danger/10 border-danger/20 text-danger"
                          : receipt.days_remaining <= 7
                            ? "bg-warning/10 border-warning/20 text-warning"
                            : "bg-success/10 border-success/20 text-success"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className="relative flex size-2 shrink-0">
                            <span className={cn(
                              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                              receipt.days_remaining < 0 ? "bg-danger" : receipt.days_remaining <= 7 ? "bg-warning" : "bg-success"
                            )}></span>
                            <span className={cn(
                              "relative inline-flex rounded-full size-2",
                              receipt.days_remaining < 0 ? "bg-danger" : receipt.days_remaining <= 7 ? "bg-warning" : "bg-success"
                            )}></span>
                          </span>
                          <span>Return Status</span>
                        </div>
                        <span className="font-black font-mono uppercase tracking-widest text-xs px-2.5 py-0.5 rounded-full border bg-surface border-current">
                          {receipt.days_remaining < 0 
                            ? `${Math.abs(receipt.days_remaining)}d overdue` 
                            : `${receipt.days_remaining} days left`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold tracking-widest text-text-muted uppercase">
                      Mark Status as
                    </h4>
                    <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-canvas border border-border rounded-xl">
                      {(["active", "returned", "kept", "expired"] as ReceiptStatus[]).map((status) => {
                        const isSel = receipt.status === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => onStatusChange(receipt, status)}
                            className={cn(
                              "text-center py-2 text-xs rounded-lg transition-all capitalize font-semibold tracking-wide select-none cursor-pointer",
                              isSel 
                                ? "bg-surface text-text-primary border border-border shadow-xs" 
                                : "text-text-muted hover:text-text-primary"
                            )}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!isMobile && (
                    <div className="flex gap-3 pt-5 border-t border-border mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(receipt)}
                        className="text-danger hover:bg-danger/10 hover:text-danger flex items-center gap-1.5 font-bold"
                      >
                        <Trash2 className="size-4" />
                        Delete Receipt
                      </Button>
                      
                      <div className="flex-1 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => onEdit(receipt)}
                          className="flex items-center gap-1.5 bg-accent text-white hover:bg-accent-hover font-bold border-none"
                        >
                          <Edit3 className="size-4" />
                          Edit Details
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {isMobile && (
              <div className="flex gap-3 p-4 border-t border-border bg-surface shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(receipt)}
                  className="text-danger hover:bg-danger/10 hover:text-danger flex items-center gap-1.5 font-bold"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
                
                <div className="flex-1 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onEdit(receipt)}
                    className="flex items-center gap-1.5 bg-accent text-white hover:bg-accent-hover font-bold border-none"
                  >
                    <Edit3 className="size-4" />
                    Edit Details
                  </Button>
                </div>
              </div>
            )}

          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
