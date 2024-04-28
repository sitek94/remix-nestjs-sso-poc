import express, {type Response, type NextFunction} from 'express'
import crypto from 'node:crypto'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import {config} from './config'

const app = express()

const authSessionStorage = new Map<string, Request['session']>()

type Request = express.Request & {
  session?: {
    accessToken?: string
    refreshToken?: string
    idToken?: string
  }
}

app.use(cookieParser())
app.use(morgan('dev'))

// Auth middleware
app.use((req: Request, res, next) => {
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
      <a href="/login">Login with Microsoft</a>
  `),
  )
})

app.get('/home', requireAuth, (req, res) => {
  res.send(
    render(`
      <h1>Welcome to Remix App</h1>
      <p>You are now logged in!</p>
      <a href="/logout">Logout</a>
      <hr />
      <ul>
        <li><a href="/profile">My Profile</a></li>
        <li><a href="/leaders">Leaders</a></li>
      </ul>
  `),
  )
})

app.get('/profile', requireAuth, async (req: Request, res) => {
  const response = await fetch(`${config.nestjsUrl}/profile`, {
    headers: {
      Authorization: `Bearer ${req.session!.idToken}`,
    },
  })

  const {name} = await response.json()

  res.send(
    render(`
        <h1>Profile</h1>
        <p>Name: ${name}</p>
        <a href="/home">Go back</a>
    `),
  )
})

app.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.microsoft.clientId,
    response_type: 'code',
    redirect_uri: config.microsoft.redirectUri,
    response_mode: 'query',
    scope: config.microsoft.scope,
  })

  res.redirect(`${config.microsoft.oauthUrl}/authorize?${params.toString()}`)
})

app.get('/logout', async (req: Request, res) => {
  delete req.session
  res.clearCookie('sessionId')

  res.redirect(
    `${config.microsoft.oauthUrl}/logout?post_logout_redirect_uri=${config.remixUrl}`,
  )
})

app.get('/auth/microsoft/callback', async (req: Request, res) => {
  const {code} = req.query

  try {
    const response = await fetch(`${config.microsoft.oauthUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.microsoft.clientId,
        code: code as string,
        redirect_uri: config.microsoft.redirectUri,
        client_secret: config.microsoft.clientSecret,
        scope: config.microsoft.scope,
      }),
    })

    console.log(response)

    const tokens = await response.json()

    req.session!.accessToken = tokens.access_token
    req.session!.refreshToken = tokens.refresh_token
    req.session!.idToken = tokens.id_token

    res.redirect('/home')
  } catch (error) {
    console.error('Error exchanging token:', error)
    res.status(500).send('Failed to exchange token')
  }

  res.redirect('/home')
})

app.get('/leaders', requireAuth, async (req: Request, res) => {
  const response = await fetch(
    `${config.microsoft.graphUrl}/groups/${config.microsoft.leadersGroupId}/members?$select=id,displayName,mail`,
    {
      headers: {
        Authorization: `Bearer ${req.session!.accessToken}`,
      },
    },
  )

  const {value: leaders} = (await response.json()) as {
    value: {displayName: string; mail: string}[]
  }

  res.send(
    render(`
      <h1>Leaders</h1>
      <hr />
      <ul>
        ${leaders
          .map(
            ({displayName, mail}) => `
            <li>
              <strong>${displayName}</strong> - ${mail}
            </li>
          `,
          )
          .join('')}
      </ul>
      <a href="/home">Go back</a>
  `),
  )
})

app.listen(config.remixPort, () => {
  console.log(`Server running on ${config.remixUrl}`)
})

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.accessToken) {
    return res.status(401).send(
      render(`
      <h1>Unauthorized</h1>
      <p>You need to login first</p>
      <a href="/login">Login</a>
    `),
    )
  }

  next()
}

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
