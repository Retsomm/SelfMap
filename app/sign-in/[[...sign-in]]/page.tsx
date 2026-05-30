import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 52px)', marginTop: '52px' }}>
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-(--ink-soft) mb-6 select-none">
        SelfMap · 身份驗證
      </p>
      <SignIn />
    </div>
  )
}
