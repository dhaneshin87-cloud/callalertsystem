import { Router } from "express";
import { createEventHandler, listEventsHandler } from "../controllers/eventcontroller";

const router = Router();

router.post("/eventcreate",createEventHandler);
router.get("/list", listEventsHandler);

export default router;
