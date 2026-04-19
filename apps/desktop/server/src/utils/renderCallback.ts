const ORBIT_ENV = (process.env.ORBIT_ENV || 'prod').toLowerCase()
const DEEPLINK_SCHEME = ORBIT_ENV === 'prod' ? 'orbit' : `orbit-dev`

interface CallbackPageParams {
  code: string
  state: string
}

interface ComposioCallbackParams {
  status: string
  connectedAccountId: string
}

/**
 * Shared page shell used by all callback pages.
 */
function renderPage(opts: {
  title: string
  heading: string
  subtitle: string
  success: boolean
  deepLink?: string
  autoRedirect?: boolean
}): string {
  const iconColor = opts.success ? '#22c55e' : '#ef4444'
  const checkIcon =
    '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />'
  const errorIcon =
    '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />'

  const openButton = opts.deepLink
    ? `<a href="${opts.deepLink}" style="display:inline-block;margin-top:32px;padding:12px 32px;background:#111;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;transition:opacity 0.15s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Open Orbit</a>`
    : ''

  const autoRedirectScript =
    opts.autoRedirect && opts.deepLink
      ? `<script>setTimeout(function(){window.location.href=${JSON.stringify(opts.deepLink)}},1000);</script>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title} - Orbit</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#111;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .container{text-align:center;max-width:440px;padding:48px 32px}
    .icon{width:56px;height:56px;border-radius:50%;margin:0 auto 28px;display:flex;align-items:center;justify-content:center;background:${iconColor}}
    .icon svg{width:28px;height:28px}
    h1{font-size:28px;font-weight:700;margin-bottom:12px;letter-spacing:-0.02em}
    .subtitle{font-size:16px;color:#666;line-height:1.6}
    .hint{margin-top:16px;font-size:13px;color:#999}
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
        ${opts.success ? checkIcon : errorIcon}
      </svg>
    </div>
    <h1>${opts.heading}</h1>
    <p class="subtitle">${opts.subtitle}</p>
    ${openButton}
    ${opts.deepLink ? '<p class="hint">You can close this tab and return to Orbit.</p>' : ''}
  </div>
  ${autoRedirectScript}
</body>
</html>`
}

export function renderComposioCallbackPage(
  params: ComposioCallbackParams,
): string {
  const isSuccess = params.status === 'success'
  const deepLink = `${DEEPLINK_SCHEME}://composio/callback?status=${encodeURIComponent(params.status)}&connected_account_id=${encodeURIComponent(params.connectedAccountId)}`

  return renderPage({
    title: isSuccess ? 'Connected' : 'Connection Failed',
    heading: isSuccess ? 'Connected!' : 'Connection Failed',
    subtitle: isSuccess
      ? 'Your account has been connected successfully.'
      : 'Something went wrong while connecting your account. Please try again from the app.',
    success: isSuccess,
    deepLink,
    autoRedirect: isSuccess,
  })
}

export function renderCallbackPage(params: CallbackPageParams): string {
  const deepLink = params.code && params.state
    ? `${DEEPLINK_SCHEME}://auth/callback?code=${encodeURIComponent(params.code)}&state=${encodeURIComponent(params.state)}`
    : undefined

  return renderPage({
    title: 'Login Successful',
    heading: 'Connected!',
    subtitle: 'You can close this tab and return to Orbit.',
    success: true,
    deepLink,
    autoRedirect: true,
  })
}

export function renderDesktopCallbackSuccess(redirectUrl: string): string {
  return renderPage({
    title: 'Login Successful',
    heading: 'Connected!',
    subtitle: 'You can close this tab and return to Orbit.',
    success: true,
    deepLink: redirectUrl,
    autoRedirect: true,
  })
}

export function renderDesktopCallbackError(message: string): string {
  return renderPage({
    title: 'Login Failed',
    heading: 'Something went wrong',
    subtitle: message,
    success: false,
  })
}
