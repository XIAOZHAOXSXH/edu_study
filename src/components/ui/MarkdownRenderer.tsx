'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="text-sm leading-7 text-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-xl font-bold text-gray-950 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 text-lg font-bold text-gray-950 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-gray-950 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-950">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-primary-200 bg-primary-50 px-3 py-2 text-gray-700">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-900">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs leading-6 text-gray-50">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-900">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary-700 underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
