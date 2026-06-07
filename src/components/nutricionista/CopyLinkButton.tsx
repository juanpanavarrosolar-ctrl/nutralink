'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
        copied
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
          : 'text-emerald-600 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
      }`}
    >
      {copied ? (
        <>
          <Check size={11} />
          Copiado
        </>
      ) : (
        <>
          <Copy size={11} />
          Copiar link
        </>
      )}
    </button>
  )
}
