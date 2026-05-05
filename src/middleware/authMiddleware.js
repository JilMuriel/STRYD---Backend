import { prisma } from "../lib/prism.js";

export const requireAuth = async (req, res, next) => {
    try {
        const userId = req.cookies.userId;
        
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            res.clearCookie("userId");
            return res.status(401).json({ error: "Invalid session" });
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};