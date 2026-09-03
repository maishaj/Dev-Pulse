
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connectionString: process.env.CONNECTIONSTRING,
  secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'contributor'
          CHECK(role IN ('contributor','maintainer')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL CHECK(LENGTH(description)>=20),
        type VARCHAR(20) NOT NULL
           CHECK(type IN ('bug','feature_request')),
        status VARCHAR(20) NOT NULL DEFAULT 'open'
           CHECK(status IN ('open','in_progress','resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
    console.log("Database created successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var sinupUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const userData = await pool.query(`
    SELECT * FROM users WHERE email=$1
    `, [email]);
  if (userData.rows.length > 0) {
    throw new Error("This email already exists!");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
    INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,COALESCE($4,'contributor'))
    RETURNING *
    `, [name, email, hashedPassword, role]);
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
    SELECT * FROM users where email=$1
    `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const accessToken = jwt.sign(jwtpayload, config_default.secret, { expiresIn: "1d" });
  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  sinupUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const result = await authService.sinupUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token: result.accessToken,
        user: result.user
      }
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const { title, description, type, status } = payload;
  const result = await pool.query(`
    INSERT INTO issues(title,description,type,status,reporter_id)
    VALUES($1,$2,$3,COALESCE($4,'open'),$5)
    RETURNING *
    `, [title, description, type, status, reporterId]);
  return result;
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `
    SELECT * FROM issues
    `;
  const values = [];
  const conditions = [];
  if (type) {
    values.push(type);
    conditions.push(`type=$${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status=$${values.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  if (sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }
  const result = await pool.query(sql, values);
  const issues = result.rows;
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const userResult = await pool.query(`
            SELECT id,name,role FROM users
            WHERE id=$1
            `, [issue.reporter_id]);
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
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(`
        SELECT * FROM issues
        WHERE id=$1
        `, [id]);
  if (result.rows.length === 0) {
    throw new Error("Issue not found!");
  }
  const issue = result.rows[0];
  const userData = await pool.query(`
        SELECT id,name,role FROM users WHERE id=$1
        `, [issue.reporter_id]);
  const singleIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userData.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return singleIssue;
};
var updateIsssueFromDB = async (id, payload, reporterId, userRole) => {
  const { title, description, type } = payload;
  const issueResult = await pool.query(`
    SELECT * FROM issues
    WHERE id=$1
    `, [id]);
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found!");
  }
  const issue = issueResult.rows[0];
  if (userRole !== "maintainer") {
    if (issue.reporter_id !== reporterId || issue.status !== "open") {
      throw new Error("You don't have permission to update this issue!");
    }
  }
  const result = await pool.query(`
        UPDATE issues
        SET
          title=COALESCE($1,title),
          description=COALESCE($2, description),
          type=COALESCE($3,type),
          updated_at=NOW()
        WHERE id=$4
        RETURNING *
        `, [title, description, type, id]);
  return result.rows[0];
};
var deleteIssueFromDB = async (id, userRole) => {
  if (userRole !== "maintainer") {
    throw new Error("You don't have permission to delete this issue!");
  }
  const result = await pool.query(`
    DELETE FROM issues WHERE id=$1
    `, [id]);
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIsssueFromDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issueService.createIssueIntoDB(
      req.body,
      req.user.id
    );
    console.log(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const query = req.query;
    const result = await issueService.getAllIssuesFromDB(query);
    if (result.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "No issues found"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully!",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.updateIsssueFromDB(id, req.body, req.user.id, req.user.role);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.deleteIssueFromDB(id, req.user.role);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Issue not found!",
        data: null
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteUser
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access!"
        });
        return;
      }
      const authToken = token.split(" ")[1];
      const decoded = jwt2.verify(
        authToken,
        config_default.secret
      );
      const userData = await pool.query(`
            SELECT * FROM users WHERE id=$1
            `, [decoded.id]);
      if (userData.rows.length === 0) {
        sendResponse_default(res, {
          statusCode: 404,
          success: false,
          message: "User not found!"
        });
        return;
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden! You don't have access"
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default(), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(), issueController.updateIssue);
router2.delete("/:id", auth_default(), issueController.deleteUser);
var issuesRoute = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Hello, The app's running!"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map