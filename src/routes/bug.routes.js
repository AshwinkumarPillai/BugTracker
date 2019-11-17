import BugController from "../controllers/bugController";
import auth from "../auth/auth";
import { Router } from "express";

const router = Router();

router.post("/all", BugController.getAll);
router.post("/new", auth.checkToken, BugController.createBug);
router.post("/edit", auth.checkToken, BugController.edit);
router.post("/watch", auth.checkToken, BugController.watchBug);
router.post("/archive", auth.checkToken, BugController.archive);
router.post("/solution", auth.checkToken, BugController.solution);
router.post("/assignDev", auth.checkToken, BugController.AssignDev);

module.exports = router;
