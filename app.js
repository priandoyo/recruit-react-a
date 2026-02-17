// app.js
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))

// ===== In-memory SQLite DB =====
const db = new sqlite3.Database(':memory:')

db.serialize(() => {
  db.run(`CREATE TABLE applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    university TEXT,
    status TEXT
  )`)

  const stmt = db.prepare("INSERT INTO applicants (name, university, status) VALUES (?, ?, ?)")
  const data = [
    ['Alice','UI','Accepted'],
    ['Bob','UGM','Rejected'],
    ['Charlie','ITB','Accepted'],
    ['Diana','UNPAD','Accepted'],
    ['Evan','ITS','Rejected'],
    ['Fiona','UI','Accepted'],
    ['George','UGM','Rejected'],
    ['Hannah','ITB','Accepted'],
    ['Ian','UNPAD','Rejected'],
    ['Jane','ITS','Accepted']
  ]
  data.forEach(row => stmt.run(row))
  stmt.finalize()
})

// ===== HTML Renderer =====
function renderHTML(applicants, message='') {
  let rows = applicants.map(a => 
    `<tr><td>${a.name}</td><td>${a.university}</td><td>${a.status}</td></tr>`
  ).join('\n')

  return `
<!DOCTYPE html>
<html>
<head><title>Recruitment Status</title></head>
<body>
  <h1>Recruitment Status Checker</h1>

  <form action="/check" method="POST">
    <input type="text" name="name" placeholder="Enter your name" required>
    <button type="submit">Check Status</button>
  </form>

  ${message ? `<p><strong>${message}</strong></p>` : ''}

  <h2>Applicants Table</h2>
  <table border="1">
    <tr><th>Name</th><th>University</th><th>Status</th></tr>
    ${rows}
  </table>
</body>
</html>
`
}

// ===== Routes =====
app.get('/', (req, res) => {
  db.all("SELECT * FROM applicants", [], (err, rows) => {
    res.send(renderHTML(rows))
  })
})

app.post('/check', (req, res) => {
  const name = req.body.name
  db.get("SELECT * FROM applicants WHERE name = ?", [name], (err, row) => {
    let message = row ? `${row.name} — ${row.status}` : 'Name not found'
    db.all("SELECT * FROM applicants", [], (err, rows) => {
      res.send(renderHTML(rows, message))
    })
  })
})

// ===== Start Server =====
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`App running on http://localhost:${port}`))
