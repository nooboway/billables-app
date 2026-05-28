import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pdfTemplateRouter from "./pdfTemplate";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pdf-template", pdfTemplateRouter);

export default router;
