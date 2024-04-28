import z from 'zod'

const processEnvSchema = z.object({
  MICROSOFT_CLIENT_ID: z.string(),
  MICROSOFT_CLIENT_SECRET: z.string(),
  MICROSOFT_REDIRECT_URI: z.string(),
  MICROSOFT_TENANT_ID: z.string(),
})

processEnvSchema.parse(process.env)

const microsoft = {
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  tenantId: process.env.MICROSOFT_TENANT_ID,
  graphUrl: 'https://graph.microsoft.com/v1.0',
  loginUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
  oauthUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0`,
}

const remixPort = 3000
const nestjsPort = 4000

export const config = {
  remixPort,
  nestjsPort,
  remixUrl: `http://localhost:${remixPort}`,
  nestjsUrl: `http://localhost:${nestjsPort}`,
  microsoft,
}
