import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pdfTemplateRouter from "./pdfTemplate";
import invoicePreviewRouter from "./invoicePreview";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pdf-template", pdfTemplateRouter);
router.use("/invoice-preview", invoicePreviewRouter);

export default router;
