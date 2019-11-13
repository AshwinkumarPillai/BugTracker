import BugController from "../controllers/bugController";
import auth from "../auth/auth";
import { Router } from "express";

const router = Router();

router.post("/all", BugController.getAll);
router.post("/new", auth, BugController.createBug);
router.post("/edit", auth, BugController.edit);
router.post("/watch", auth, BugController.watchBug);
router.post("/archive", auth, BugController.archive);
router.post("/solution", auth, BugController.solution);
router.post("/assignDev", auth, BugController.AssignDev);

module.exports = router;
