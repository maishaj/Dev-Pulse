import { pool } from "../../db";
import bcrypt from "bcrypt";

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

export const authService={
    sinupUserIntoDB,
}