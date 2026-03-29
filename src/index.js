import "dotenv/config";
import express from "express";
import cors from "cors";
import "./services/db.js";
import healthRouter from "./routes/health.js";
import activitiesRouter from "./routes/activities.js";
import testRoutes from './routes/test.js';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", activitiesRouter);
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);

app.use((err, req, res, next) => {
  const status = err.status && Number.isFinite(err.status) ? err.status : 500;
  res.status(status).json({
    error: err.message || "internal_error",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
