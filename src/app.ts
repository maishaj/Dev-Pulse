import express, { type Application, type Request, type Response } from "express";
import sendResponse from "./utility/sendResponse";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";

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
app.use("/api/issues",issuesRoute);

export default app;
