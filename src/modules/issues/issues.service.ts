import { pool } from "../../db";

// Create Issue
const createIssueIntoDB=async(payload:{title:string,description:string,type:string,status?:string},reporterId:number)=>{
   const {title,description,type,status}=payload;

   const result=await pool.query(`
    INSERT INTO issues(title,description,type,status,reporter_id)
    VALUES($1,$2,$3,COALESCE($4,'open'),$5)
    RETURNING *
    `,[title,description,type,status,reporterId]);

    return result;
}

// get all issues
const getAllIssuesFromDB=async(query:{ sort?:string, type?:string, status?:string})=>{

    const {sort="newest",type,status}=query;

    let sql=`
    SELECT * FROM issues
    `;

    const values:any[]=[];
    const conditions:string[]=[];

    // Filter by type
    if(type){
        values.push(type);
        conditions.push(`type=$${values.length}`);
    }

    // Filter by status
    if(status){
        values.push(status);
        conditions.push(`status=$${values.length}`)
    }

    if(conditions.length>0){
        sql+=` WHERE ${conditions.join(" AND ")}`;
    }

    if(sort==="oldest"){
        sql+=` ORDER BY created_at ASC`;
    }
    else{
        sql+=` ORDER BY created_at DESC`;
    }

    const result=await pool.query(sql,values);
    const issues=result.rows;

    for(let i = 0; i < issues.length; i++){

        const issue = issues[i];

        const userResult=await pool.query(`
            SELECT id,name,role FROM users
            WHERE id=$1
            `,[issue.reporter_id]);
        
        issues[i] = {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: userResult.rows[0],
        created_at: issue.created_at,
        updated_at: issue.updated_at
    };
    }

    return issues;
}

//get Single Issue
const getSingleIssueFromDB=async(id:string)=>{
     const result=await pool.query(`
        SELECT * FROM issues
        WHERE id=$1
        `,[id],);

    if(result.rows.length===0){
        throw new Error("Issue not found!");
    }

    const issue=result.rows[0];

    //Reporter info

    const userData=await pool.query(`
        SELECT id,name,role FROM users WHERE id=$1
        `,[issue.reporter_id]);
    
    const singleIssue={
        id:issue.id,
        title:issue.title,
        description:issue.description,
        type:issue.type,
        status:issue.status,
        reporter:userData.rows[0],
        created_at: issue.created_at,
        updated_at: issue.updated_at
    };

    return singleIssue;
}


export const issueService={
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
}