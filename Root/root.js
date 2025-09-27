const express = require('express');
const router = express.Router();
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config();



// ====== Multer Memory Storage Setup (CHANGED) ======
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage

// ====== Controllers & Middleware ======
const { register, login } = require('../controller/authenticationController');
const {updateProfile}=require("../controller/profileUpdateController");
const auth =require("../MiddleWare/jwtMiddleware");
const {
  createTask,
  updateUserTaskStatus,
  getUserTasks,
} = require("../controller/taskController");


// ====== Auth Routes ====== //
router.post('/register',upload.single("file"),register);
router.post('/login', login);


//==========User Routes =========//
 router.put("/user/profile/update",auth,upload.single("file"),updateProfile);
 router.put("/update/workflow/:taskId",auth,updateUserTaskStatus);
 router.get("/user/get/alltask",auth,getUserTasks);


 // ========= Task Routes ========//
router.post("/amin/create/task",auth,createTask);
router.get("/admin/get/alltask",auth,getUserTasks);

module.exports = router;