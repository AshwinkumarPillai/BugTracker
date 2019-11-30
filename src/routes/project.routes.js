import projectController from "../controllers/projectController";
import auth from "../auth/auth";
import { Router } from "express";

const router = Router();

router.post("/new", auth.checkToken, projectController.createProject);
router.post("/addbuddy", auth.checkToken, projectController.addBuddy);
router.post("/getAllUsers", auth.checkToken, projectController.getAllUsers);
// router.get("/verify-add", projectController.verifybuddy);
router.get("/approveProject", auth.checkToken, projectController.approveProject);
router.post("/rejectProject", auth.checkToken, projectController.rejectProject);
router.post("/removeBuddy", auth.checkToken, projectController.removeBuddy);
router.post("/delete", auth.checkToken, projectController.deleteProject);

module.exports = router;
