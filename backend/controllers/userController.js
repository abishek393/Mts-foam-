import User from "../models/User.js";

// Roles an admin may create here. Customers are excluded on purpose — they
// self-register through /api/auth/register.
const ADMIN_CREATABLE_ROLES = ["employee", "marketer", "dealer", "admin"];

// @desc    Create a new staff, dealer or admin account
// @route   POST /api/users   (admin)
export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role, profileImage } = req.body;

        if (!ADMIN_CREATABLE_ROLES.includes(role)) {
            return res.status(400).json({
                message: `Role must be one of: ${ADMIN_CREATABLE_ROLES.join(", ")}.`,
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role,
            profileImage,
        });

        res.status(201).json({
            message: "User created successfully",
            user: user.toSafeObject(),
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] },
        });

        res.status(200).json({
            message: "Users fetched successfully",
            count: users.length,
            users,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update user by ID
// @route   PUT /api/users/:id
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { firstName, lastName, email, password, phone, role, profileImage, isActive } = req.body;

        await user.update({
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(email !== undefined && { email }),
            ...(password !== undefined && { password }),
            ...(phone !== undefined && { phone }),
            ...(role !== undefined && { role }),
            ...(profileImage !== undefined && { profileImage }),
            ...(isActive !== undefined && { isActive }),
        });

        res.status(200).json({
            message: "User updated successfully",
            user: user.toSafeObject(),
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete user by ID
// @route   DELETE /api/users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
