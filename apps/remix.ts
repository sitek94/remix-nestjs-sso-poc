import express from 'express'
import {URLSearchParams} from 'node:url'
import crypto from 'crypto'
import cookieParser from 'cookie-parser'

const app = express()
const PORT = 3000

const microsoftAuthUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0`

type SessionData = {
  accessToken?: string
  idToken?: string
}

interface Req extends express.Request {
  session?: SessionData
}

const authSessionStorage = new Map<string, SessionData>()

app.use(cookieParser())

// Auth middleware
app.use((req: Req, res, next) => {
  const sessionId = req.cookies['sessionId']
  if (sessionId && authSessionStorage.has(sessionId)) {
    req.session = authSessionStorage.get(sessionId)!
  } else {
    const newSessionId = crypto.randomBytes(16).toString('hex')
    authSessionStorage.set(newSessionId, {})
    res.cookie('sessionId', newSessionId, {httpOnly: true, secure: false})
    req.session = authSessionStorage.get(newSessionId)!
  }
  next()
})

app.get('/', (req, res) => {
  res.send(
    render(`
      <h1>Welcome to Remix App</h1>
      <button onclick="location.href='/login'" style="cursor:pointer;">Login with Microsoft</button>
  `),
  )
})

app.get('/home', (req: Req, res) => {
  if (!req.session?.accessToken) {
    return res.status(401).send('Unauthorized')
  }

  res.send(
    render(`
      <h1>Welcome to Remix App</h1>
      <p>You are now logged in!</p>
      <button onclick="location.href='/logout'" style="cursor:pointer;">Logout</button>
  `),
  )
})

app.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    response_mode: 'query',
    scope: 'openid profile email',
  })

  res.redirect(`${microsoftAuthUrl}/authorize?${params.toString()}`)
})

app.get('/logout', async (req: Req, res) => {
  delete req.session
  res.clearCookie('sessionId')

  res.redirect(`${microsoftAuthUrl}/logout?post_logout_redirect_uri=`)
})

app.get('/auth/microsoft/callback', async (req: Req, res) => {
  const {code} = req.query

  try {
    const response = await fetch(`${microsoftAuthUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        code: code as string,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        scope: 'openid profile email',
      }) as any,
    })

    const tokens = await response.json()

    console.log({tokens}) // You will see access_token, refresh_token, id_token here

    req.session!.accessToken = tokens.access_token
    req.session!.idToken = tokens.id_token

    res.redirect('/home')
  } catch (error) {
    console.error('Error exchanging token:', error)
    res.status(500).send('Failed to exchange token')
  }

  res.redirect('/home')
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

function render(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remix App</title>
</head>
<body>
    ${content}
</body>
</html>
`
}
