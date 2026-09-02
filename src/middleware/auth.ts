import type { NextFunction, Request, Response } from "express";
import type { ROLES } from "../types";
import sendResponse from "../utility/sendResponse";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth=(...roles:ROLES[])=>{
    return async(req:Request,res:Response,next:NextFunction)=>{
         try{
           const token=req.headers.authorization;

           if(!token){
             sendResponse(res,{
                statusCode:401,
                success:false,
                message:"Unauthorized access!",
             });
             return;
           }

           const authToken=token.split(" ")[1];

           const decoded=jwt.verify(
              authToken as string,
              config.secret as string
           ) as JwtPayload;

          const userData=await pool.query(`
            SELECT * FROM users WHERE id=$1
            `,[decoded.id]);

          if(userData.rows.length===0){
            sendResponse(res,{
                statusCode:404,
                success:false,
                message:"User not found!",
            })
            return;
          }

           const user=userData.rows[0];

           if(roles.length && !roles.includes(user.role)){
             sendResponse(res,{
                statusCode:403,
                success:false,
                message:"Forbidden! You don't have access",
            })
            return;
           }

           req.user=decoded;
           
           next();

         }
         catch(error:any){
            next(error);
         }
    }

}

export default auth;