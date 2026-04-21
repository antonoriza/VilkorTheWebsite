/**
 * RichTextEditor — Enhanced rich text input using contentEditable.
 *
 * Features:
 *   - Headings H1/H2/H3 via custom dropdown (no focus-stealing)
 *   - Bold, Italic, Underline, Strikethrough
 *   - Bullet and numbered lists
 *   - Text color: 12-swatch palette + custom hex
 *   - Remove format button
 *   - Character counter with limit feedback
 *
 * All toolbar actions use onMouseDown + preventDefault to keep
 * the editor's selection intact before applying commands.
 */
import { useRef, useCallback, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  maxLength?: number
  placeholder?: string
}

const COLOR_PALETTE = [
  { hex: '#0f172a', label: 'Negro' },
  { hex: '#475569', label: 'Gris' },
  { hex: '#94a3b8', label: 'Gris claro' },
  { hex: '#dc2626', label: 'Rojo' },
  { hex: '#ea580c', label: 'Naranja' },
  { hex: '#ca8a04', label: 'Ámbar' },
  { hex: '#16a34a', label: 'Verde' },
  { hex: '#0284c7', label: 'Azul' },
  { hex: '#7c3aed', label: 'Violeta' },
  { hex: '#db2777', label: 'Rosa' },
  { hex: '#0891b2', label: 'Cian' },
  { hex: '#065f46', label: 'Esmeralda' },
]

const HEADING_OPTIONS = [
  { tag: 'div', label: 'Párrafo', className: 'text-sm font-medium text-slate-500' },
  { tag: 'h1', label: 'Título 1', className: 'text-xl font-black text-slate-900 font-headline' },
  { tag: 'h2', label: 'Título 2', className: 'text-base font-extrabold text-slate-900' },
  { tag: 'h3', label: 'Título 3', className: 'text-sm font-bold text-slate-800' },
]

const Sep = () => <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

export default function RichTextEditor({
  value,
  onChange,
  maxLength = 2500,
  placeholder = 'Escribe aquí...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showHeadings, setShowHeadings] = useState(false)
  const [activeHeading, setActiveHeading] = useState('Párrafo')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [hexInput, setHexInput] = useState('')

  const getTextLength = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || '').length
  }

  const charCount = getTextLength(value)
  const isOverLimit = charCount > maxLength

  const sync = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange(html === '<br>' ? '' : html)
    }
  }, [onChange])

  /** Run a document.execCommand and sync state without blurring */
  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    sync()
  }, [sync])

  const applyHeading = useCallback((tag: string, label: string) => {
    editorRef.current?.focus()
    // Use 'div' as the paragraph equivalent for consistent behavior
    document.execCommand('formatBlock', false, tag === 'div' ? '<div>' : `<${tag}>`)
    sync()
    setActiveHeading(label)
    setShowHeadings(false)
  }, [sync])

  const applyColor = useCallback((hex: string) => {
    editorRef.current?.focus()
    document.execCommand('foreColor', false, hex)
    sync()
    setShowColorPicker(false)
    setHexInput('')
  }, [sync])

  const isValidHex = /^#?[0-9A-Fa-f]{6}$/.test(hexInput)
  const normalizedHex = hexInput.startsWith('#') ? hexInput : `#${hexInput}`

  return (
    <div className="rounded-xl border border-slate-200 overflow-visible bg-white focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all">

      {/* ── Toolbar ── */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200 rounded-t-xl"
        onMouseDown={(e) => e.preventDefault()}  /* prevent any child from stealing focus */
      >

        {/* ── Heading dropdown ── */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowHeadings(p => !p); setShowColorPicker(false) }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all whitespace-nowrap"
          >
            {activeHeading}
            <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
          </button>

          {showHeadings && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/80 py-1 min-w-[140px]">
              {HEADING_OPTIONS.map(({ tag, label, className }) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyHeading(tag, label) }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${className}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* ── Format buttons ── */}
        {([
          { cmd: 'bold',          icon: 'format_bold',         title: 'Negrita (Ctrl+B)' },
          { cmd: 'italic',        icon: 'format_italic',       title: 'Cursiva (Ctrl+I)' },
          { cmd: 'underline',     icon: 'format_underlined',   title: 'Subrayado (Ctrl+U)' },
          { cmd: 'strikeThrough', icon: 'strikethrough_s',     title: 'Tachado' },
        ] as const).map(({ cmd, icon, title }) => (
          <button
            key={cmd}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec(cmd) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
            title={title}
          >
            <span className="material-symbols-outlined text-[17px]">{icon}</span>
          </button>
        ))}

        <Sep />

        {/* ── List buttons ── */}
        {([
          { cmd: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Lista con viñetas' },
          { cmd: 'insertOrderedList',   icon: 'format_list_numbered', title: 'Lista numerada'    },
        ] as const).map(({ cmd, icon, title }) => (
          <button
            key={cmd}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec(cmd) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
            title={title}
          >
            <span className="material-symbols-outlined text-[17px]">{icon}</span>
          </button>
        ))}

        <Sep />

        {/* ── Color picker ── */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(p => !p); setShowHeadings(false) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
            title="Color de texto"
          >
            <span className="material-symbols-outlined text-[17px]">format_color_text</span>
          </button>

          {showColorPicker && (
            <div
              className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/80 p-3 w-52"
              onMouseDown={(e) => e.preventDefault()}
            >
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paleta</p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {COLOR_PALETTE.map(({ hex, label }) => (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    onMouseDown={(e) => { e.preventDefault(); applyColor(hex) }}
                    className="w-6 h-6 rounded-md border-2 border-white shadow-sm hover:scale-110 transition-transform ring-1 ring-slate-200/60"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hex personalizado</p>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-7 h-7 rounded-lg border border-slate-200 flex-shrink-0 transition-colors"
                  style={{ backgroundColor: isValidHex ? normalizedHex : '#f8fafc' }}
                />
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidHex) applyColor(normalizedHex)
                  }}
                  placeholder="#1e293b"
                  maxLength={7}
                  className="flex-1 px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-400 text-slate-700"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); if (isValidHex) applyColor(normalizedHex) }}
                  disabled={!isValidHex}
                  className="px-2 py-1 text-[10px] font-bold bg-slate-900 text-white rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-all"
                >
                  OK
                </button>
              </div>

              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applyColor('#000000') }}
                className="mt-2 w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all text-center"
              >
                Restablecer color
              </button>
            </div>
          )}
        </div>

        {/* ── Remove formatting ── */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); setActiveHeading('Párrafo') }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all ml-auto"
          title="Quitar todo el formato"
        >
          <span className="material-symbols-outlined text-[17px]">format_clear</span>
        </button>
      </div>

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={sync}
        onClick={() => { setShowHeadings(false); setShowColorPicker(false) }}
        dangerouslySetInnerHTML={{ __html: value }}
        className={[
          'w-full min-h-[100px] max-h-[240px] overflow-y-auto px-4 py-3 bg-white outline-none',
          'text-sm leading-relaxed text-slate-800 font-medium',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-300',
          // Heading styles
          '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_h1]:leading-tight [&_h1]:my-1',
          '[&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:my-1',
          '[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-800 [&_h3]:my-0.5',
          // List styles
          '[&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:list-decimal [&_ol]:pl-5',
          // Inline styles
          '[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through',
          isOverLimit ? 'ring-1 ring-inset ring-rose-300' : '',
        ].join(' ')}
      />

      {/* ── Footer: char counter ── */}
      <div className="flex items-center justify-end px-3 py-1.5 border-t border-slate-100 rounded-b-xl bg-slate-50">
        <span className={`text-[10px] font-bold uppercase tracking-widest tabular-nums ${
          isOverLimit ? 'text-rose-500' : charCount > maxLength * 0.85 ? 'text-amber-500' : 'text-slate-300'
        }`}>
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
