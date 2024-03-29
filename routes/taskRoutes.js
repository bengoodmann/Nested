const { Router } = require("express");
const authenticateToken = require("../middlewares/tokenHandler");
const validateTask = require("../middlewares/fileDetailsValidator");
const { createTask, allTask } = require("../controllers/taskController");
const router = Router();

router.use(authenticateToken)
router.get("/", allTask)
router.post("/", validateTask, createTask)



module.exports = router