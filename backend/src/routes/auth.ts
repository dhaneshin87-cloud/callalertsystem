import { Router } from "express";
import { googleAuth,googleCallback,registerUser } from "../controllers/authcontroller";
const router = Router();

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/register", registerUser);



export default router;
