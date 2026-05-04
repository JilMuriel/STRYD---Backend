import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRouter from "./routes/health.js";
import activitiesRouter from "./routes/activities.js";
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import dashboardRoutes from './routes/dashboard.js'


const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: "http://localhost:5173", // your frontend
    credentials: true, // allow cookies / auth
  })
);

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
  const status = err.status && Number.isFinite(err.status) ? err.status : 500;
  res.status(status).json({
    error: err.message || "internal_error",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
