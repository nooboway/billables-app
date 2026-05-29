import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

interface PreviewEntry {
  invoiceData: unknown;
  businessDetails: unknown;
  bankAccount: unknown;
  templateSettings: unknown;
  createdAt: string;
  seen: boolean;
  seenAt?: string;
}

const store = new Map<string, PreviewEntry>();

router.post("/", (req, res) => {
  const { invoiceData, businessDetails, bankAccount, templateSettings } = req.body;
  if (!invoiceData) { res.status(400).json({ error: "Missing invoiceData" }); return; }
  const token = randomUUID().replace(/-/g, "").slice(0, 20);
  store.set(token, {
    invoiceData, businessDetails, bankAccount, templateSettings,
    createdAt: new Date().toISOString(),
    seen: false,
  });
  if (store.size > 2000) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
  res.json({ token });
});

router.get("/:token", (req, res) => {
  const entry = store.get(req.params.token);
  if (!entry) { res.status(404).json({ error: "Preview not found or expired" }); return; }
  res.json(entry);
});

router.post("/:token/seen", (req, res) => {
  const entry = store.get(req.params.token);
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  entry.seen = true;
  entry.seenAt = new Date().toISOString();
  res.json({ ok: true, seenAt: entry.seenAt });
});

router.get("/:token/status", (req, res) => {
  const entry = store.get(req.params.token);
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ seen: entry.seen, seenAt: entry.seenAt });
});

export default router;
