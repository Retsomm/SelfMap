import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 52px)', marginTop: '52px' }}>
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-(--ink-soft) mb-6 select-none">
        SelfMap · 身份驗證
      </p>
      {/* Apple 登入暫時隱藏，購買 Apple Developer 帳號後移除 appearance 設定即可恢復 */}
      <SignIn appearance={{
        elements: {
          socialButtonsBlockButton__apple: { display: 'none' },
          socialButtonsIconButton__apple: { display: 'none' },
        },
      }} />
    </div>
  )
}
