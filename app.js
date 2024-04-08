const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/public");

const port = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
    req.pool = pool;
    next();
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    nombrepersonnes INTEGER,
    evenement TEXT,
    remarque TEXT
)`;

pool.query(createTableQuery, (err) => {
    if (err) throw err;
    console.log("Table is successfully created or already exists.");
});

app.post("/submit-form", (req, res) => {
    const { nom, prenom, nombrepersonnes, evenement, remarque } = req.body;
    const insertQuery = `
    INSERT INTO guests (nom, prenom, nombrepersonnes, evenement, remarque)
    VALUES ($1, $2, $3, $4, $5)`;

    pool.query(insertQuery, [nom, prenom, nombrepersonnes, evenement, remarque], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/confirmation");
    });
});

app.get("/view-guests", (req, res) => {
    pool.query("SELECT * FROM guests", (err, result) => {
        if (err) throw err;
        let tableHtml = "<table border='1'><tr><th>Nom</th><th>Prénom</th><th>Nombre de Personnes</th><th>Événement</th><th>Remarque</th></tr>";
        result.rows.forEach((row) => {
            tableHtml += `<tr><td>${row.nom}</td><td>${row.prenom}</td><td>${row.nombrepersonnes}</td><td>${row.evenement}</td><td>${row.remarque}</td></tr>`;
        });
        tableHtml += "</table>";
        res.send(tableHtml);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
