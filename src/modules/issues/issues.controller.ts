import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { issueService } from "./issues.service";

// Create Issue
const createIssue=async(req:Request,res:Response)=>{
   try{
       const result=await issueService.createIssueIntoDB(
        req.body,
        req.user!.id
       );
       console.log(req.body);
       sendResponse(res,{
        statusCode:201,
        success:true,
        message:"Issue created successfully",
        data:result.rows[0]
      })
   }
   catch(error:any){
     sendResponse(res,{
        statusCode:500,
        success:false,
        message:error.message,
        error:error
        })
   }
}

// Get All Issues
const getAllIssues=async(req:Request,res:Response)=>{
     try{
       const query=req.query as {
        sort?:string,
        type?:string,
        status?:string
       }
 
       const result=await issueService.getAllIssuesFromDB(query);

       sendResponse(res,{
        statusCode: 200,
        success: true,
        message: "Issues retrieved successfully",
        data: result
       })


     }
     catch(error:any){
         sendResponse(res,{
        statusCode:500,
        success:false,
        message:error.message,
        error:error
        })
     }
}


export const issueController={
    createIssue,
    getAllIssues,
}