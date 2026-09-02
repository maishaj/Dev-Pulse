import { Router } from "express";
import { issueController } from "./issues.controller";
import auth from "../../middleware/auth";

const router=Router();

router.post("/",auth(),issueController.createIssue);
router.get("/",issueController.getAllIssues);
router.get("/:id",issueController.getSingleIssue);
router.patch("/:id",auth(),issueController.updateIssue);
router.delete("/:id",auth(),issueController.deleteUser);


export const issuesRoute=router;