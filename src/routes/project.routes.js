import projectController from "../controllers/projectController";
import auth from "../auth/auth";
import { Router } from "express";

const router = Router();

router.post("/new", auth, projectController.createProject);
router.post("/addbuddy", auth, projectController.addBuddy);
router.post("/getAllUsers", auth, projectController.getAllUsers);
router.post("/verify-add", projectController.verifybuddy);
router.post("/removeBuddy", auth, projectController.removeBuddy);

module.exports = router;
