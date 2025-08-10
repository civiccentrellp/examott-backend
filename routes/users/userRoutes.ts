import express from "express";
import {
  createUserFromAdmin,
  assignUserRole,
  getAllUsers,
  getAllRoles,
  updateUser,
  deleteUser,
  getUserById
} from "../../controllers/users/userController.ts";

const router = express.Router();

router.post("/", createUserFromAdmin);              
router.get("/", getAllUsers);                       
router.get("/:id", getUserById);                    
router.put("/:id", updateUser);                   
router.delete("/:id", deleteUser);                  
router.patch("/:id/role", assignUserRole);          
router.get("/roles", getAllRoles);                  

export default router;
