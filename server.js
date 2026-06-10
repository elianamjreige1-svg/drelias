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

/*
app.get("/drugs", async (req,res)=>{

    const drugs = await query(
        "SELECT * FROM drugs ORDER BY name"
    );

    res.json(drugs);

});*/

app.get("/drugs", async (req, res) => {

    try {

        const { name } = req.query;

        let sql = "SELECT * FROM drugs WHERE 1=1";
        let params = [];

        // SEARCH by name (optional)
        if (name && name.trim() !== "") {
            sql += " AND name LIKE ?";
            params.push("%" + name.trim() + "%");
        }

        sql += " ORDER BY name ASC";

        const drugs = await query(sql, params);

        res.json(drugs);

    } catch (err) {
        console.error("GET /drugs error:", err);
        res.status(500).send("Server error");
    }

});

app.post("/deductStock", async (req,res)=>{

    const { items } = req.body;

    try{

        for(const item of items){

            const drug = await query(
                "SELECT quantity FROM drugs WHERE id=?",
                [item.id]
            );

            if(drug.length === 0){
                return res.status(400).send("Drug not found");
            }

            if(drug[0].quantity < item.qty){
                return res.status(400)
                .send("Not enough stock for "+item.name);
            }

        }

        for(const item of items){

            await query(
                `UPDATE drugs
                 SET quantity = quantity - ?
                 WHERE id = ?`,
                [item.qty,item.id]
            );

        }

        res.send("ok");

    }
    catch(err){
        console.log(err);
        res.status(500).send("error");
    }

});


app.post("/drugs", async (req,res)=>{

      const { name, quantity, price } = req.body;

    const existing = await db.query(
        "SELECT * FROM drugs WHERE LOWER(name) = LOWER(?)",
        [name]
    );

    if(existing.length > 0){
        return res.status(400).send("Drug already exists");
    }

    await query(
        "INSERT INTO drugs (name, quantity, price) VALUES (?,?,?)",
        [name, quantity, price]
    );

    res.send("ok");
});

app.put("/drugs/:id", async (req,res)=>{

    const { id } = req.params;
    const { name, quantity, price } = req.body;

    await query(
        "UPDATE drugs SET name=?, quantity=?, price=? WHERE id=?",
        [name, quantity, price, id]
    );

    res.send("ok");
});

app.delete("/drugs/:id", async (req,res)=>{

    const { id } = req.params;

    await query(
        "DELETE FROM drugs WHERE id=?",
        [id]
    );

    res.send("ok");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

  
