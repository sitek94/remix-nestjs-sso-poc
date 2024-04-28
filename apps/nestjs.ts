import express from 'express'
import morgan from 'morgan'
import jwt from 'jsonwebtoken'
import {config} from './config'

const app = express()

type Request = express.Request & {
  user?: {
    name: string
  }
}

app.use(express.json())
app.use(morgan('dev'))

// Auth middleware
app.use(async (req: Request, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).send('Unauthorized: No token provided')
  }

  const [_, token] = authHeader.split(' ')

  const decoded = jwt.decode(token, {complete: true})
  if (!decoded) {
    return res.status(401).send('Unauthorized: Invalid token format')
  }

  const microsoftPublicKeys = await getMicrosoftPublicKeys()

  const matchingKey = microsoftPublicKeys.keys.find(
    (key: {kid: string; x5c: string[]}) => key.kid === decoded.header.kid,
  )

  if (!matchingKey) {
    return res.status(401).send('Unauthorized: No matching public key found')
  }

  const cert = `-----BEGIN CERTIFICATE-----\n${matchingKey.x5c[0]}\n-----END CERTIFICATE-----`

  jwt.verify(token, cert, {algorithms: ['RS256']}, error => {
    if (error) {
      return res.status(401).send('Unauthorized: Invalid token signature')
    }
  })

  req.user = {
    name: (decoded.payload as any).name,
  }

  next()
})

app.get('/profile', async (req: Request, res) => {
  res.json({
    name: req.user.name,
  })
})

app.listen(config.nestjsPort, () => {
  console.log(`Server running on ${config.nestjsUrl}`)
})

async function getMicrosoftPublicKeys() {
  const response = await fetch(
    `${config.microsoft.loginUrl}/discovery/keys?appid=${config.microsoft.clientId}`,
  )

  const keys = await response.json()

  return keys
}
