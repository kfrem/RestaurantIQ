import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// Initialize routes once. Vercel keeps the function warm between requests.
const initPromise = registerRoutes(httpServer, app).then(() => {
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const isClientError = status >= 400 && status < 500;
    const message = isClientError
      ? err.message || "Bad Request"
      : "Internal Server Error";
    console.error("Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });
});

export default async function handler(req: Request, res: Response) {
  await initPromise;
  return app(req, res);
}
