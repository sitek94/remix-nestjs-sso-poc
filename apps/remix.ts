import express from 'express'

const app = express()
const PORT = 3000

// Simple HTML rendering function
const render = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Remix Imitation</title>
</head>
<body>
    ${content}
</body>
</html>
`

// Routes simulating Remix file-based routing
app.get('/', (req, res) => {
  res.send(render('<h1>Welcome to the Home Page</h1>'))
})

app.get('/about', (req, res) => {
  res.send(render('<h1>About Us</h1>'))
})

app.get('/contact', (req, res) => {
  res.send(render('<h1>Contact Us</h1>'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
