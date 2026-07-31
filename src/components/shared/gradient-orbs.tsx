export function GradientOrbs({ variant = 'indigo' }: { variant?: 'indigo' | 'red' }) {
  const a = variant === 'red' ? 'bg-rose-600/25' : 'bg-indigo-600/25'
  const b = variant === 'red' ? 'bg-purple-700/25' : 'bg-fuchsia-600/20'
  const c = variant === 'red' ? 'bg-orange-600/15' : 'bg-violet-600/20'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full ${a} blur-[110px] animate-float`} />
      <div className={`absolute -bottom-32 -right-16 h-[30rem] w-[30rem] rounded-full ${b} blur-[120px] animate-float`} style={{ animationDelay: '3s' }} />
      <div className={`absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full ${c} blur-[100px] animate-float`} style={{ animationDelay: '6s' }} />
    </div>
  )
}
