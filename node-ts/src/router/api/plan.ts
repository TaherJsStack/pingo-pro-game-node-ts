import express from "express";
import PlanManager from "../../controllers/api/plan-manager";
import signReqData from "../../middleware/sign-req-data";

const router = express.Router();
const planManager = new PlanManager();

router.post("/", signReqData, planManager.createItem as unknown as express.RequestHandler);

router.get("/", signReqData, planManager.getAllItems);

router.get("/:id", signReqData, planManager.getItemById);

router.put("/:id", signReqData, planManager.updateItem);

router.delete("/:id", signReqData, planManager.deleteItem);

export default router;
