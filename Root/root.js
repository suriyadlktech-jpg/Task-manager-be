const express = require('express');
const router = express.Router();
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config();



// ====== Multer Memory Storage Setup (CHANGED) ======
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage

// ====== Controllers & Middleware ======
const { register, login, logout } = require('../controller/authenticationController');
const {updateProfile}=require("../controller/profileUpdateController");
const auth =require("../MiddleWare/jwtMiddleware");
const {
  createTask,
  updateUserTaskStatus,
} = require("../controller/taskController");

const{
    getAllUsers,
    getDashboardStats,
    getTasks,
    deleteUser,
    getRecentTasks,
} = require("../controller/adminController");

const { getUserAssignedTasks ,
    getUserTaskCounts,

} = require('../controller/userController');


// ====== Auth Routes ====== //
router.post('/register',upload.single("file"),register);
router.post('/login',login);


//==========User Routes =========//
 router.put("/user/profile/update",auth,upload.single("file"),updateProfile);
 router.put("/update/workflow/:taskId",auth,updateUserTaskStatus);
 router.get("/user/get/alltask",auth,getUserAssignedTasks);
 router.get("/user/task/counts",auth,getUserTaskCounts);
 router.post("/user/logout",auth,logout)


 // ========= Admin Routes ========//
router.post("/admin/create/task",auth,upload.array("attachments"),createTask);
router.get("/admin/get/alltask",auth,getTasks);
router.get("/admin/get/allUsers",getAllUsers);
router.delete("/admin/delete/user/:userId",auth,deleteUser);
router.get("/admin/dashboard/stats",auth,getDashboardStats);
router.get("/admin/recent/tasks",auth,getRecentTasks);

module.exports = router;