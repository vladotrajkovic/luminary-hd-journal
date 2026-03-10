// lib/generatePdf.ts
// Generates a clean, print-ready PDF of the HD report using jsPDF

export interface ReportData {
  sections: Record<string, string>
  profile: {
    full_name?: string
    hd_type?: string
    hd_authority?: string
    hd_profile?: string
    hd_definition?: string
    hd_incarnation_cross?: string
  } | null
}

const SECTION_LABELS: Record<string, string> = {
  intro:     'Introduction',
  type:      'Your Type',
  authority: 'Your Authority',
  profile:   'Your Profile',
  centers:   'The Nine Centers',
  channels:  'Your Channels',
  final:     'Your Path Forward',
}

const SECTION_ORDER = ['intro', 'type', 'authority', 'profile', 'centers', 'channels', 'final']

// Colours (light theme)
const C = {
  gold:       [139, 107, 40]  as [number,number,number],
  purple:     [80,  50,  140] as [number,number,number],
  text:       [30,  25,  50]  as [number,number,number],
  subtext:    [90,  80,  120] as [number,number,number],
  divider:    [200, 190, 230] as [number,number,number],
  pageBg:     [252, 250, 255] as [number,number,number],
  headerBg:   [240, 235, 255] as [number,number,number],
  accent:     [120, 80,  200] as [number,number,number],
}

// Page metrics (A4)
const PAGE_W    = 210
const PAGE_H    = 297
const MARGIN_L  = 20
const MARGIN_R  = 20
const MARGIN_T  = 24
const MARGIN_B  = 24
const TEXT_W    = PAGE_W - MARGIN_L - MARGIN_R

export async function generateHDReportPdf(data: ReportData): Promise<void> {
  // Dynamic import so jsPDF is never bundled server-side
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  let y = MARGIN_T

  // ── Helper: check page break ──────────────────────────────
  const checkPage = (neededHeight = 10) => {
    if (y + neededHeight > PAGE_H - MARGIN_B) {
      doc.addPage()
      drawPageBg()
      y = MARGIN_T
    }
  }

  // ── Helper: draw page background ─────────────────────────
  const drawPageBg = () => {
    doc.setFillColor(...C.pageBg)
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
    // Subtle left accent bar
    doc.setFillColor(...C.accent)
    doc.setFillColor(180, 160, 230)
    doc.rect(0, 0, 3, PAGE_H, 'F')
  }

  // ── Helper: wrapped text, returns new Y ──────────────────
  const addText = (
    text: string,
    x: number,
    startY: number,
    options: {
      fontSize?: number
      font?: 'times' | 'helvetica'
      style?: 'normal' | 'bold' | 'italic' | 'bolditalic'
      color?: [number, number, number]
      maxWidth?: number
      lineHeightFactor?: number
    } = {}
  ): number => {
    const {
      fontSize = 11,
      font = 'times',
      style = 'normal',
      color = C.text,
      maxWidth = TEXT_W,
      lineHeightFactor = 1.6,
    } = options

    doc.setFont(font, style)
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)

    const lines = doc.splitTextToSize(text, maxWidth)
    const lineH = (fontSize / 2.835) * lineHeightFactor // mm per line

    let curY = startY
    for (const line of lines) {
      checkPage(lineH + 2)
      doc.text(line, x, curY)
      curY += lineH
    }
    return curY
  }

  // ── Helper: horizontal divider ───────────────────────────
  const addDivider = (style: 'full' | 'short' = 'short') => {
    checkPage(6)
    const w = style === 'full' ? TEXT_W : 40
    const x = style === 'full' ? MARGIN_L : PAGE_W / 2 - w / 2
    doc.setDrawColor(...C.divider)
    doc.setLineWidth(0.3)
    doc.line(x, y, x + w, y)
    y += 5
  }

  // ── Helper: section heading ───────────────────────────────
  const addSectionHeading = (label: string) => {
    checkPage(22)
    // Subtle background pill
    doc.setFillColor(...C.headerBg)
    doc.roundedRect(MARGIN_L - 2, y - 5, TEXT_W + 4, 14, 2, 2, 'F')
    // Small accent line
    doc.setFillColor(...C.accent)
    doc.rect(MARGIN_L - 2, y - 5, 2.5, 14, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.purple)
    const upper = label.toUpperCase()
    doc.text(upper, MARGIN_L + 4, y + 4.5, { charSpace: 1.5 })
    y += 14
  }

  // ── Helper: parse and render section content ─────────────
  const renderSectionContent = (text: string) => {
    // Split into paragraphs
    const paragraphs = text.split(/\n{1,}/).map(p => p.trim()).filter(Boolean)

    for (const para of paragraphs) {
      checkPage(12)

      // Detect bullet points (lines starting with "- ")
      if (para.startsWith('- ')) {
        // Bullet point
        const bulletText = para.slice(2)
        // Draw bullet dot
        doc.setFillColor(...C.accent)
        doc.circle(MARGIN_L + 3, y - 1.5, 1, 'F')
        y = addText(bulletText, MARGIN_L + 8, y, {
          fontSize: 11,
          font: 'times',
          style: 'normal',
          color: C.text,
          maxWidth: TEXT_W - 8,
          lineHeightFactor: 1.55,
        })
        y += 2
      } else {
        // Regular paragraph
        y = addText(para, MARGIN_L, y, {
          fontSize: 11,
          font: 'times',
          style: 'normal',
          color: C.text,
          lineHeightFactor: 1.65,
        })
        y += 4 // paragraph spacing
      }
    }
  }

  // ════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════
  drawPageBg()

  // Large decorative circle
  doc.setDrawColor(...C.divider)
  doc.setLineWidth(0.4)
  doc.circle(PAGE_W / 2, 95, 55, 'S')
  doc.setLineWidth(0.2)
  doc.circle(PAGE_W / 2, 95, 60, 'S')

  // LUMINARY wordmark
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.subtext)
  const luminary = 'L U M I N A R Y'
  const lw = doc.getTextWidth(luminary)
  doc.text(luminary, (PAGE_W - lw) / 2, 58)

  // Title
  doc.setFont('times', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...C.purple)
  const title = 'Human Design'
  const tw = doc.getTextWidth(title)
  doc.text(title, (PAGE_W - tw) / 2, 82)

  doc.setFont('times', 'italic')
  doc.setFontSize(20)
  doc.setTextColor(...C.gold)
  const subtitle = 'Personal Reading'
  const sw = doc.getTextWidth(subtitle)
  doc.text(subtitle, (PAGE_W - sw) / 2, 94)

  // Decorative star
  doc.setFont('times', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(...C.divider)
  const star = '* * *'
  doc.text(star, (PAGE_W - doc.getTextWidth(star)) / 2, 108)

  // Name
  const name = data.profile?.full_name || 'Your Reading'
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...C.text)
  const nw = doc.getTextWidth(name)
  doc.text(name, (PAGE_W - nw) / 2, 128)

  // Divider
  doc.setDrawColor(...C.divider)
  doc.setLineWidth(0.3)
  doc.line(PAGE_W / 2 - 25, 133, PAGE_W / 2 + 25, 133)

  // Chart summary stats
  const stats = [
    { label: 'Type',      value: data.profile?.hd_type || '—' },
    { label: 'Authority', value: data.profile?.hd_authority || '—' },
    { label: 'Profile',   value: data.profile?.hd_profile || '—' },
    { label: 'Definition',value: data.profile?.hd_definition || '—' },
  ].filter(s => s.value !== '—')

  const statY = 148
  const colW = TEXT_W / stats.length
  stats.forEach((stat, i) => {
    const cx = MARGIN_L + colW * i + colW / 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C.subtext)
    const lbl = stat.label.toUpperCase()
    doc.text(lbl, cx - doc.getTextWidth(lbl) / 2, statY, { charSpace: 0.8 })

    doc.setFont('times', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...C.purple)
    const val = stat.value
    doc.text(val, cx - doc.getTextWidth(val) / 2, statY + 8)
  })

  // Incarnation cross
  if (data.profile?.hd_incarnation_cross) {
    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(...C.subtext)
    const cross = `Incarnation Cross: ${data.profile.hd_incarnation_cross}`
    doc.text(cross, (PAGE_W - doc.getTextWidth(cross)) / 2, statY + 22)
  }

  // Date generated
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.divider)
  const dateStr = `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  doc.text(dateStr, (PAGE_W - doc.getTextWidth(dateStr)) / 2, PAGE_H - 16)

  // Footer bar
  doc.setFillColor(180, 160, 230)
  doc.rect(0, PAGE_H - 4, PAGE_W, 4, 'F')

  // ════════════════════════════════════════════════════════
  // REPORT SECTIONS
  // ════════════════════════════════════════════════════════
  for (const key of SECTION_ORDER) {
    const content = data.sections[key]
    if (!content) continue

    // Always start each section on a fresh page
    doc.addPage()
    drawPageBg()
    y = MARGIN_T

    addSectionHeading(SECTION_LABELS[key])
    y += 4

    renderSectionContent(content)
  }

  // ── Page numbers on all pages except cover ────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.divider)
    const pageLabel = `${p - 1} / ${totalPages - 1}`
    doc.text(pageLabel, PAGE_W / 2 - doc.getTextWidth(pageLabel) / 2, PAGE_H - 10)
    // Footer bar
    doc.setFillColor(180, 160, 230)
    doc.rect(0, PAGE_H - 4, PAGE_W, 4, 'F')
    // Luminary footer text
    doc.setFontSize(7)
    doc.setTextColor(...C.subtext)
    doc.text('Luminary · Human Design Personal Reading', MARGIN_L, PAGE_H - 10)
  }

  // ── Save ──────────────────────────────────────────────────
  const fileName = `Luminary_HD_Report_${(data.profile?.full_name || 'Reading').replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`
  doc.save(fileName)
}
