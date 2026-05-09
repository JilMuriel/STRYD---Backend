import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/index.js";
import healthRouter from "./routes/health.js";
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import dashboardRoutes from './routes/dashboard.js'


const app = express();
const PORT = Number(process.env.PORT) || 4000;

if (config.isProd) {
  app.set("trust proxy", 1);
}

// CORS configuration - CRITICAL FIX for authentication
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin)) return callback(null, true);
      const err = new Error("CORS origin not allowed");
      err.status = 403;
      return callback(err);
    },
    credentials: true, // allow cookies / auth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

console.log("✅ Allowed CORS origins:", config.allowedOrigins);

app.use(express.json());

app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/api", healthRouter);
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  if (err.message === "CORS origin not allowed") {
    return res.status(403).json({
      error: "cors_origin_not_allowed",
      message: "Request origin is not in the API allowlist",
    });
  }

  const status = err.status && Number.isFinite(err.status) ? err.status : 500;
  res.status(status).json({
    error: err.message || "internal_error",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
