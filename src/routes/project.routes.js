import projectController from "../controllers/projectController";
import auth from "../auth/auth";
import { Router } from "express";

const router = Router();

router.post("/new", auth.checkToken, projectController.createProject);
router.post("/addbuddy", auth.checkToken, projectController.addBuddy);
router.post("/getAllUsers", auth.checkToken, projectController.getAllUsers);
router.get("/verify-add", projectController.verifybuddy);
router.post("/removeBuddy", auth.checkToken, projectController.removeBuddy);

module.exports = router;
