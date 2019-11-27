import userController from "../controllers/userController";
import auth from "../auth/auth";
import { Router } from "express";

const router = Router();

router.post("/login", userController.login);
router.post("/register", userController.registerUser);
router.post("/getAllProjects", auth.checkToken, userController.getAllProjects);
router.post("/getOneProject", auth.checkToken, userController.getOneProject);
router.post("/update", auth.checkToken, userController.editUsers);
router.post("/getEveryUser", auth.checkToken, userController.getEveryUser);
router.post("/viewProfile", auth.checkToken, userController.viewProfile);

module.exports = router;
