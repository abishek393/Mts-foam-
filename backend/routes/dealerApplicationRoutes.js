import express from "express";
import {
    createApplication,
    getApplications,
    getApplicationDocument,
    verifyApplication,
    rejectApplication,
    holdApplication,
    getResubmission,
    resubmitDocuments,
} from "../controllers/dealerApplicationController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadDealerDocs, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Public — anyone can apply for a dealership
router.post(
    "/",
    uploadDealerDocs.fields([
        { name: "registrationDoc", maxCount: 1 },
        { name: "vatDoc", maxCount: 1 },
    ]),
    createApplication
);

// Public but token-gated — an applicant put on hold replaces their documents.
// They have no account, so the emailed token is what authorises this; it is
// random, stored only as a hash, single-use and expiring.
router.get("/:id/resubmit/:token", getResubmission);

router.post(
    "/:id/resubmit/:token",
    uploadDealerDocs.fields([
        { name: "registrationDoc", maxCount: 1 },
        { name: "vatDoc", maxCount: 1 },
    ]),
    resubmitDocuments
);

// Admin
router.get("/", authenticate, authorize("admin"), getApplications);
router.get(
    "/:id/document/:type",
    authenticate,
    authorize("admin"),
    getApplicationDocument
);
router.patch("/:id/verify", authenticate, authorize("admin"), verifyApplication);
router.patch("/:id/hold", authenticate, authorize("admin"), holdApplication);
router.patch("/:id/reject", authenticate, authorize("admin"), rejectApplication);

router.use(handleUploadError);

export default router;
