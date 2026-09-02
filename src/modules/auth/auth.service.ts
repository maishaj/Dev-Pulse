import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";

const sinupUserIntoDB=async(payload:{name:string,email:string,password:string,role:string})=>{
  const {name,email,password,role}=payload;
  
  // Checking if the same email already exists
  const userData=await pool.query(`
    SELECT * FROM users WHERE email=$1
    `,[email],);
    if(userData.rows.length>0){
        throw new Error("This email already exists!");
    }
    
  // Hashing password
  const hashedPassword=await bcrypt.hash(password,10);
  
  // Insert user
  const result=await pool.query(`
    INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,COALESCE($4,'contributor'))
    RETURNING *
    `,[name,email,hashedPassword,role]);

    delete result.rows[0].password;
    return result;

}

const loginUserIntoDB=async(payload:{email:string,password:string})=>{
   const {email,password}=payload;

   // Check if email exists in db
   const userData=await pool.query(`
    SELECT * FROM users where email=$1
    `,[email]);
   if(userData.rows.length===0){
    throw new Error("Invalid Credentials");
   }

   // Compare passwords
   const user=userData.rows[0];
   const matchPassword=await bcrypt.compare(password,user.password);
   if(!matchPassword){
     throw new Error("Invalid Credentials");
   }

   // Generate Token
   const jwtpayload={
     id:user.id,
     name:user.name,
     role:user.role,
   }
   const accessToken=jwt.sign(jwtpayload,config.secret as string,{expiresIn:"1d"});
   return {accessToken,
        user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
    }};
}

export const authService={
    sinupUserIntoDB,
    loginUserIntoDB,
}