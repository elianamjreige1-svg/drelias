const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require('mysql2');
const util = require("util");



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.json());
app.use(express.static("public"));

// ================= DB =================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
  
});
pool.on('error', (err) => {
  console.error("MySQL Pool Error:", err);
});

const query = util.promisify(pool.query).bind(pool);

// ================= LOG =================


// ================= VARIABLES =================
let tickets = [];
let resultsbyuser = [];



// ================= HELPERS =================

// ================= PATIENTS CRUD =================

// GET ALL + FILTER
app.get("/patients", async (req, res) => {

    const { id, name, dob, tel } = req.query;

    let sql = "SELECT * FROM patients WHERE 1=1";
    let params = [];

    if (id) {
        sql += " AND id = ?";
        params.push(id);
    }

    if (name) {
        sql += " AND name LIKE ?";
        params.push("%" + name + "%");
    }

    if (dob) {
        sql += " AND dob LIKE ?";
        params.push("%" + dob + "%");
    }

    if (tel) {
        sql += " AND tel LIKE ?";
        params.push("%" + tel + "%");
    }

    const patients = await query(sql, params);

    res.json(patients);
});

// ADD PATIENT
app.post("/patients", async (req, res) => {

    const { name, dob, tel } = req.body;

    await query(
        "INSERT INTO patients (name, dob, tel) VALUES (?, ?, ?)",
        [name, dob, tel]
    );

    res.send("ok");
});

// EDIT PATIENT
app.put("/patients/:id", async (req, res) => {

    const id = req.params.id;

    const { name, dob, tel } = req.body;

    await query(
        "UPDATE patients SET name=?, dob=?, tel=? WHERE id=?",
        [name, dob, tel, id]
    );

    res.send("ok");
});

// DELETE PATIENT
app.delete("/patients/:id", async (req, res) => {

    const id = req.params.id;

    await query(
        "DELETE FROM patients WHERE id=?",
        [id]
    );

    res.send("ok");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

  
