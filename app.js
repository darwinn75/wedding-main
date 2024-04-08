const express = require("express")
const bodyParser = require("body-parser")
const { Pool } = require("pg") // Import pg Pool

const app = express()
app.set("view engine", "ejs")
app.set("views", __dirname + "/public")

const port = process.env.PORT || 3000

// Connect to PostgreSQL database
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false, // Required for Heroku
	},
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

// Middleware to connect to the database
app.use((req, res, next) => {
	req.pool = pool
	next()
})

// Create table (Modify to match PostgreSQL syntax)
const createTableQuery = `
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  guestName TEXT,
  prenom TEXT,
  nombrePersonnes INTEGER,
  evenement TEXT,
  remarque TEXT
)`

pool.query(createTableQuery, (err, res) => {
	if (err) throw err
	console.log("Table is successfully created or already exists.")
})

// Routes and other logic remain mostly unchanged
// Make sure to update your queries to use pool.query and adjust SQL syntax if necessary

// Example for "/submit-form" route
app.post("/submit-form", (req, res) => {
	const { guestName, prenom, nombrePersonnes, evenement, remarque } = req.body
	const insertQuery = `
    INSERT INTO guests (guestName, prenom, nombrePersonnes, evenement, remarque)
    VALUES ($1, $2, $3, $4, $5)`

	pool.query(insertQuery, [guestName, prenom, nombrePersonnes, evenement, remarque], (err) => {
		if (err) {
			return console.error(err.message)
		}
		res.redirect(
			`/confirmation?guestName=${guestName}&prenom=${prenom}&nombrePersonnes=${nombrePersonnes}&evenement=${evenement}&remarque=${remarque}`
		)
	})
})

app.get("/confirmation", (req, res) => {
	const { guestName, prenom, nombrePersonnes, evenement, remarque } = req.query
	// Render the confirmation HTML page with guest information
	res.render("confirmation", { guestName, prenom, nombrePersonnes, evenement, remarque })
})

app.get("/view-guests", (req, res) => {
	pool.query("SELECT * FROM guests", (err, result) => {
		if (err) {
			throw err
		}
		// Construct HTML table dynamically
		let tableHtml =
			"<table border='1'><tr><th>Guest Name</th><th>First Name</th><th>Number of Guests</th><th>Event</th><th>Remarks</th></tr>"
		result.rows.forEach((row) => {
			tableHtml += `<tr><td>${row.guestname}</td><td>${row.prenom}</td><td>${row.nombrepersonnes}</td><td>${row.evenement}</td><td>${row.remarque}</td></tr>`
		})
		tableHtml += "</table>"

		// Send the HTML response
		res.send(tableHtml)
	})
})

// Start server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
