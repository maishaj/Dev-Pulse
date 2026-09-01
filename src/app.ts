import express, { type Application, type Request, type Response } from "express";
import sendResponse from "./utility/sendResponse";
import { authRoute } from "./modules/auth/auth.route";

const app:Application=express();

app.use(express.json());

app.get('/', (req:Request, res:Response) => {
   sendResponse(res,{
     statusCode:200,
     success:true,
     message:"Hello, The app's running!",
   })
});


app.use("/api/auth",authRoute);

export default app;
