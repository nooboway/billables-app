import { Router } from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, "../../scripts/pdf_template_extractor.py");

const router: Router = Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

router.post("/extract", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded" });
    return;
  }

  const pdfPath = req.file.path;
  const cleanup = () => fs.unlink(pdfPath, () => {});

  const py = spawn("python3", [SCRIPT, pdfPath]);
  let stdout = "";
  let stderr = "";

  py.stdout.on("data", (d) => { stdout += d.toString(); });
  py.stderr.on("data", (d) => { stderr += d.toString(); });

  py.on("error", (err) => {
    cleanup();
    res.status(500).json({ error: `Failed to start Python: ${err.message}` });
  });

  py.on("close", (code) => {
    cleanup();
    if (code !== 0) {
      res.status(500).json({ error: stderr || "PDF extraction script failed", code });
      return;
    }
    try {
      const result = JSON.parse(stdout.trim());
      if (result.error) {
        res.status(422).json(result);
      } else {
        res.json(result);
      }
    } catch {
      res.status(500).json({ error: "Could not parse script output", raw: stdout.slice(0, 500) });
    }
  });
});

export default router;
