import express from "express";
import PlanManager from "../../controllers/api/plan-manager";
import signReqData from "../../middleware/sign-req-data";

const router = express.Router();
const planManager = new PlanManager();

router.get("/public", signReqData, planManager.listPublicPlans);

router.get("/", signReqData, planManager.getAllItems);

router.get("/:id", signReqData, planManager.getItemById);

export default router;
