import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT token — protects routes
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Invalid token. User not found." });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated. Contact admin." });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
};

// Role-based access guard — use after authenticate
// Usage: authorize("admin", "employee")
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Role '${req.user.role}' is not authorized.`,
            });
        }
        next();
    };
};
