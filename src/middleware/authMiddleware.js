import { prisma } from "../lib/prism.js";
import { config } from "../config/index.js";

export const requireAuth = async (req, res, next) => {
    try {
        const userId = req.cookies.userId;
        
        if (!userId) {
            console.log("⚠️ No userId cookie found");
            return res.status(401).json({ 
                error: "Unauthorized",
                message: "No authentication cookie found" 
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            console.log("⚠️ User not found for userId:", userId);
            // Clear invalid cookie with proper options
            res.clearCookie("userId", {
                httpOnly: true,
                secure: config.cookie.secure,
                sameSite: config.cookie.sameSite,
                path: "/"
            });
            return res.status(401).json({ 
                error: "Invalid session",
                message: "User session not found" 
            });
        }

        console.log("✅ User authenticated:", user.id);
        req.user = user;

        next();
    } catch (error) {
        console.error("❌ Auth middleware error:", error);
        next(error);
    }
};
