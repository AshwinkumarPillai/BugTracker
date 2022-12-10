const projectController = require("../controllers/projectController");
const auth = require("../auth/auth");
const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    hello: "hi!",
  });
});

router.post("/new", auth.checkToken, projectController.createProject);
router.post("/addbuddy", auth.checkToken, projectController.addBuddy);
router.post("/getAllUsers", auth.checkToken, projectController.getAllUsers);
// router.get("/verify-add", projectController.verifybuddy);
router.post("/approveProject", auth.checkToken, projectController.approveProject);
router.post("/rejectProject", auth.checkToken, projectController.rejectProject);
router.post("/removeBuddy", auth.checkToken, projectController.removeBuddy);
router.post("/delete", auth.checkToken, projectController.deleteProject);

module.exports = router;
