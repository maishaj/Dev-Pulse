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

// Get Single Issue
const getSingleIssue=async(req:Request,res:Response)=>{
   const {id}=req.params;

   try{
      const result=await issueService.getSingleIssueFromDB(id as string);

      sendResponse(res,{
       statusCode:200,
       success:true,
       message:"Issue retrieved successfully!",
       data:result
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

// Update Issue
const updateIssue=async(req:Request,res:Response)=>{
   const {id}=req.params;
   try{
      const result=await issueService.updateIsssueFromDB(id as string,req.body,req.user!.id,req.user!.role);

      sendResponse(res,{
        statusCode: 200,
        success: true,
        message: "Issue updated successfully",
        data: result
      });
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

// Delete Issue
const deleteUser=async(req:Request,res:Response)=>{
  
  const {id}=req.params;
  try{
    const result=await issueService.deleteIssueFromDB(id as string);

    if(result.rowCount===0){
      res.status(404).json({
      success: false,
      message: "Issue not found!",
      data: null,
      });
      return;
    }

    res.status(200).json({
    success: true,
    message: "Issue deleted successfully",
    data: result.rows[0],
    });

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
    getSingleIssue,
    updateIssue,
    deleteUser,
}