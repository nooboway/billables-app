# scripts/

Standalone command-line tools that live alongside the Billable web app
but run outside it. Useful for bulk / dev / fixture work that doesn't
belong in the browser flow.

## normalize_invoices.py

Convert a folder of mixed invoice files (PDF / PNG / JPG / WebP / TIFF)
into a folder of uniform PDFs. Mirrors `src/lib/fileUnify.ts`, the
in-app unifier that runs whenever a user imports an invoice.

Install once:

```bash
pip install pillow
```

Use it:

```bash
# Convert your design pack into uniform PDFs for testing
python scripts/normalize_invoices.py ~/Downloads/billables-zip-inspect/uploads ./fixtures/invoices

# See what it would do, write nothing
python scripts/normalize_invoices.py ./uploads ./out --dry-run

# Replace existing outputs
python scripts/normalize_invoices.py ./uploads ./out --overwrite
```

PDFs pass through unchanged (text layer preserved). Images get wrapped
into one-page PDFs sized to their native pixel dimensions so nothing
is cropped or stretched.
