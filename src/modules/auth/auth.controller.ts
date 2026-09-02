import type { Request, Response } from "express"
import sendResponse from "../../utility/sendResponse"
import { authService } from "./auth.service"

// User Registration
const signupUser=async(req:Request, res:Response)=>{
    try{
      const result=await authService.sinupUserIntoDB(req.body);

      sendResponse(res,{
        statusCode:201,
        success:true,
        message:"User registered successfully",
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

// User Login
const loginUser=async(req:Request,res:Response)=>{
   try{
      const result=await authService.loginUserIntoDB(req.body);
      sendResponse(res,{
        statusCode:200,
        success:true,
        message:"Login successful",
        data:{
            token:result.accessToken,
            user:result.user
        }
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

export const authController={
    signupUser,
    loginUser
}