import express from "express";
import chunkingRoutes from "./routes/chunking";
import { validateChunkingRequest } from "./middleware/validation";

const PORT = process.env.PORT || 8000;
const app = express();

// Middleware
app.use(express.json({ limit: "1mb" })); // Limit request size
app.use("/api/chunking", validateChunkingRequest, chunkingRoutes);

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`server is running on port: http://localhost:${PORT}`);
});

export default app;
