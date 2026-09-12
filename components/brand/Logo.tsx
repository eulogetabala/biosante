import { site } from '@/lib/site'

export function Logo({ className = 'h-14' }: { className?: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-2xl bg-white p-1.5 ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={site.logo}
        alt={site.name}
        className={`${className} w-auto object-contain`}
      />
    </span>
  )
}
