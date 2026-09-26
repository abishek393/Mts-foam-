import express from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Staff and dealer accounts are created here, by an admin only. Customers
// self-register through /api/auth/register instead.
router.use(authenticate, authorize("admin"));

// POST   /api/users       - Create a staff, dealer or admin account
router.post("/", createUser);

// GET    /api/users       - Get all users
router.get("/", getAllUsers);

// GET    /api/users/:id   - Get a single user by ID
router.get("/:id", getUserById);

// PUT    /api/users/:id   - Update a user by ID
router.put("/:id", updateUser);

// DELETE /api/users/:id   - Delete a user by ID
router.delete("/:id", deleteUser);

export default router;
