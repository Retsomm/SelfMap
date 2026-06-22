import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/human-design',
  '/account(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stats',
  '/api/charts',           // 未登入可計算但不儲存（POST handler 內部判斷 userId）
  '/api/composite/create', // 未登入可預覽合圖但不儲存
  '/api/transit/create',   // 未登入可預覽流日但不儲存
  '/sitemap.xml',
  '/robots.txt',
])

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.pathname + req.nextUrl.search
  const isPublic = isPublicRoute(req)
  const { userId } = await auth()

  console.log(`[Auth] ${req.method} ${url} | public=${isPublic} | userId=${userId ?? 'none'}`)

  if (!isPublic && !userId) {
    console.log(`[Auth] 未登入，阻擋存取: ${url}`)
  }

  if (!isPublic) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wasm)).*)',
    '/(api|trpc)(.*)',
  ],
}
