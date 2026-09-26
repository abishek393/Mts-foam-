import express from "express";
import {
    createFieldOrder,
    getMyFieldOrders,
    submitReport,
    getMyReports,
    getAllReports,
    annotateReport,
    downloadReport,
    downloadReports,
    downloadOrder,
} from "../controllers/marketerController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// ─── The marketer's own panel ────────────────────────────────────────────────
// An admin is allowed through too, so the panel can be checked without holding
// a second login.

const field = authorize("marketer", "admin");

router.post("/orders", field, createFieldOrder);
router.get("/orders", field, getMyFieldOrders);

router.post("/reports", field, submitReport);
router.get("/reports", field, getMyReports);

// ─── Admin ───────────────────────────────────────────────────────────────────
// Declared under /admin so none of these can be reached by the marketer routes
// above, whatever id is passed.

router.get("/admin/reports", authorize("admin"), getAllReports);

// Before "/admin/reports/:id/pdf" so "pdf" is never read as an id.
router.get("/admin/reports/pdf", authorize("admin"), downloadReports);
router.get("/admin/reports/:id/pdf", authorize("admin"), downloadReport);
router.patch("/admin/reports/:id", authorize("admin"), annotateReport);

router.get("/admin/orders/:id/pdf", authorize("admin", "employee"), downloadOrder);

export default router;
