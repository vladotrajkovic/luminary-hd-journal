// lib/generatePdf.tsx
// Generates the Luminary HD Report PDF using @react-pdf/renderer.

import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportData {
  sections: Record<string, string>
  bodyGraphImage?: string   // base64 PNG captured via html2canvas
  profile: {
    full_name?: string
    hd_type?: string
    hd_authority?: string
    hd_profile?: string
    hd_definition?: string
    hd_incarnation_cross?: string
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  intro:     'Your Reading',
  type:      'Your Type',
  authority: 'Your Inner Authority',
  profile:   'Your Profile',
  centers:   'The Nine Centers',
  channels:  'Your Active Channels',
  final:     'Your Path Forward',
}

const SECTION_ORDER = ['intro', 'type', 'authority', 'profile', 'centers', 'channels', 'final']

// ─── Static "Intro to Human Design" page text ────────────────────────────────

const INTRO_TO_HD = `Human Design is a synthesis of ancient wisdom and modern science — a system that maps the unique energetic blueprint you were born with. Drawing on the I Ching, the Kabbalah's Tree of Life, the Hindu-Brahmin Chakra system, astrology, and Quantum Physics, it offers a remarkably precise map of how you are designed to move through the world.

Your chart is calculated from your exact birth data — date, time, and place. It reveals your Type (how your energy moves through life), your Authority (how your body knows what is right for you), your Profile (the archetypal role you carry), your defined and open Centers (where you are consistent and where you are open to the world), and your active Channels (the fixed circuits of energy and awareness woven through your design).

Human Design is not a belief system. It asks nothing of you intellectually. It is an experiment — designed to be tested in the laboratory of your own life, in your own body, over time. The invitation is simply to observe: does this match what I actually experience? Does moving with my design feel more natural, more alive, more like myself?

Your chart does not define you — it describes you. And the more gently and curiously you explore it, the more it may point you back toward something you already knew.`

// ─── Markdown parser ──────────────────────────────────────────────────────────

interface Segment {
  text: string
  bold?: boolean
  italic?: boolean
}

function parseInline(raw: string): Segment[] {
  const segs: Segment[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) segs.push({ text: raw.slice(last, m.index) })
    segs.push(
      m[1] !== undefined
        ? { text: m[1], bold: true }
        : { text: m[2], italic: true }
    )
    last = re.lastIndex
  }
  if (last < raw.length) segs.push({ text: raw.slice(last) })
  return segs
}

type BlockType = 'subheading' | 'bullet' | 'divider' | 'paragraph'
interface Block { type: BlockType; text: string; segs: Segment[] }

function parseBlocks(content: string): Block[] {
  const out: Block[] = []
  const paras = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

  for (const para of paras) {
    const lines = para.split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines) {
      if (line === '---') {
        out.push({ type: 'divider', text: '', segs: [] })
        continue
      }
      const hm = line.match(/^\*\*(.+)\*\*$/)
      if (hm) {
        out.push({ type: 'subheading', text: hm[1], segs: [] })
        continue
      }
      if (line.startsWith('- ')) {
        const t = line.slice(2)
        out.push({ type: 'bullet', text: t, segs: parseInline(t) })
        continue
      }
      out.push({ type: 'paragraph', text: line, segs: parseInline(line) })
    }
  }
  return out
}

function inlineNodes(segs: Segment[], Text: any): React.ReactElement[] {
  if (!segs.length) return []
  return segs.map((s, i) =>
    React.createElement(Text, {
      key: i,
      style: {
        fontFamily: s.bold
          ? 'Helvetica-Bold'
          : s.italic
          ? 'Times-Italic'
          : 'Times-Roman',
      },
    }, s.text)
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateHDReportPdf(data: ReportData): Promise<void> {
  const RP = await import('@react-pdf/renderer')
  const { Document, Page, View, Text, Image, StyleSheet, pdf } = RP

  // ── Colour palette ─────────────────────────────────────────
  const C = {
    pageBg:      '#F6F4E8',
    headerBg:    '#D4D0C0',
    headingBg:   '#252040',
    body:        '#28231A',
    subheading:  '#3A2878',
    gold:        '#8B6B28',
    divider:     '#CCCAB8',
    muted:       '#7A7060',
    white:       '#FFFFFF',
    coverBg:     '#180E48',
    coverAccent: '#D4AF37',
    coverPurple: '#C4B5FD',
  }

  // ── StyleSheet ─────────────────────────────────────────────
  const S = StyleSheet.create({
    page: {
      backgroundColor: C.pageBg,
      paddingBottom: 44,
      fontFamily: 'Times-Roman',
      color: C.body,
    },
    pageHeaderBar: {
      backgroundColor: C.headerBg,
      paddingHorizontal: 36,
      paddingVertical: 9,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pageHeaderSection: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      color: '#50483C',
      letterSpacing: 1.2,
    },
    pageHeaderName: {
      fontSize: 7,
      fontFamily: 'Helvetica',
      color: '#50483C',
    },
    sectionBar: {
      backgroundColor: C.headingBg,
      paddingHorizontal: 36,
      paddingVertical: 14,
      marginBottom: 2,
    },
    sectionBarTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: C.white,
      letterSpacing: 2,
    },
    sectionBarSub: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: 'rgba(255,255,255,0.5)',
      marginTop: 3,
    },
    content: {
      paddingHorizontal: 36,
      paddingTop: 30,
    },
    para: {
      fontSize: 11,
      fontFamily: 'Times-Roman',
      color: C.body,
      lineHeight: 1.75,
      marginBottom: 10,
    },
    subheading: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: C.subheading,
      marginTop: 8,
      marginBottom: 6,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 7,
      paddingLeft: 4,
    },
    bulletDot: {
      width: 5,
      height: 5,
      backgroundColor: C.gold,
      transform: 'rotate(45deg)',
      marginRight: 9,
      marginTop: 4,
    },
    bulletText: {
      flex: 1,
      fontSize: 11,
      fontFamily: 'Times-Roman',
      color: C.body,
      lineHeight: 1.65,
    },
    hrule: {
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
      marginVertical: 18,
    },
    footer: {
      position: 'absolute',
      bottom: 16,
      left: 36,
      right: 36,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 7,
      fontFamily: 'Helvetica',
      color: C.muted,
    },
    coverPage: {
      backgroundColor: C.coverBg,
      paddingBottom: 0,
    },
    coverTopStripe: {
      backgroundColor: C.coverAccent,
      height: 5,
    },
    coverBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 48,
      paddingTop: 64,
      paddingBottom: 64,
    },
    coverBrand: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: 'rgba(212,175,55,0.65)',
      letterSpacing: 5,
      marginBottom: 44,
    },
    coverTitle: {
      fontSize: 38,
      fontFamily: 'Times-Roman',
      color: '#EAE4FF',
      textAlign: 'center',
      marginBottom: 6,
    },
    coverSubtitle: {
      fontSize: 17,
      fontFamily: 'Times-Roman',
      color: C.coverAccent,
      textAlign: 'center',
      marginBottom: 52,
    },
    coverRule: {
      width: 56,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(212,175,55,0.35)',
      marginBottom: 52,
    },
    coverName: {
      fontSize: 26,
      fontFamily: 'Times-Roman',
      color: C.white,
      textAlign: 'center',
      marginBottom: 28,
    },
    coverStatsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    coverStatItem: {
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    coverStatLabel: {
      fontSize: 6,
      fontFamily: 'Helvetica-Bold',
      color: 'rgba(212,175,55,0.6)',
      letterSpacing: 1.5,
      marginBottom: 5,
    },
    coverStatValue: {
      fontSize: 13,
      fontFamily: 'Times-Roman',
      color: C.coverPurple,
      textAlign: 'center',
    },
    coverStatDivider: {
      borderRightWidth: 0.5,
      borderRightColor: 'rgba(212,175,55,0.18)',
    },
    coverCross: {
      fontSize: 9,
      fontFamily: 'Times-Roman',
      color: 'rgba(196,181,253,0.38)',
      textAlign: 'center',
      marginTop: 16,
    },
    coverDate: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: 'rgba(255,255,255,0.22)',
      textAlign: 'center',
      marginTop: 52,
    },
    coverBottomStripe: {
      backgroundColor: 'rgba(212,175,55,0.22)',
      height: 3,
    },
    contentsTitle: {
      fontSize: 26,
      fontFamily: 'Times-Roman',
      color: C.headingBg,
      marginBottom: 4,
    },
    contentsSub: {
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: C.muted,
      marginBottom: 28,
    },
    contentsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingBottom: 8,
      marginBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
    },
    contentsLabel: {
      fontSize: 11,
      fontFamily: 'Times-Roman',
      color: C.body,
    },
    contentsNote: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: C.muted,
    },
    contentsFoot: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: C.muted,
      marginTop: 24,
    },
    introLabel: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      color: C.gold,
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    introTitle: {
      fontSize: 28,
      fontFamily: 'Times-Roman',
      color: C.headingBg,
      marginBottom: 6,
    },
    introSub: {
      fontSize: 11,
      fontFamily: 'Times-Roman',
      color: C.muted,
      marginBottom: 18,
    },
    introRule: {
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
      marginBottom: 20,
    },
  })

  // ── Shared components ──────────────────────────────────────
  const name    = data.profile?.full_name || 'Your Reading'
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const PageHeader = ({ section }: { section: string }) => (
    <>
      <View style={S.pageHeaderBar} fixed>
        <Text style={S.pageHeaderSection}>{section.toUpperCase()}</Text>
        <Text style={S.pageHeaderName}>{name}</Text>
      </View>
      <View style={{ height: 16 }} fixed />
    </>
  )

  const PageFooter = () => (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>Luminary — Human Design Personal Reading</Text>
      <Text
        style={S.footerText}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  )

  const renderBlocks = (blocks: Block[]) => {
    const elements: React.ReactElement[] = []
    let i = 0
    while (i < blocks.length) {
      const b = blocks[i]
      if (b.type === 'subheading') {
        const headingEl = React.createElement(Text, { style: S.subheading }, b.text)
        const next = blocks[i + 1]
        let nextEl: React.ReactElement | null = null
        if (next && next.type === 'bullet') {
          nextEl = React.createElement(
            View, { style: S.bulletRow },
            React.createElement(View, { style: S.bulletDot }),
            React.createElement(Text, { style: S.bulletText }, ...inlineNodes(next.segs, Text))
          )
        } else if (next && next.type === 'paragraph') {
          nextEl = React.createElement(Text, { style: S.para }, ...inlineNodes(next.segs, Text))
        }
        if (nextEl) {
          elements.push(React.createElement(View, { key: i, wrap: false }, headingEl, nextEl))
          i += 2
        } else {
          elements.push(React.createElement(View, { key: i, wrap: false }, headingEl))
          i += 1
        }
        continue
      }
      if (b.type === 'divider') {
        elements.push(React.createElement(View, { key: i, style: S.hrule }))
        i++; continue
      }
      if (b.type === 'bullet') {
        elements.push(React.createElement(
          View, { key: i, style: S.bulletRow },
          React.createElement(View, { style: S.bulletDot }),
          React.createElement(Text, { style: S.bulletText }, ...inlineNodes(b.segs, Text))
        ))
        i++; continue
      }
      elements.push(React.createElement(Text, { key: i, style: S.para }, ...inlineNodes(b.segs, Text)))
      i++
    }
    return elements
  }

  // ── Cover page ─────────────────────────────────────────────
  const stats = [
    { label: 'TYPE',       value: data.profile?.hd_type || '' },
    { label: 'AUTHORITY',  value: data.profile?.hd_authority || '' },
    { label: 'PROFILE',    value: data.profile?.hd_profile || '' },
    { label: 'DEFINITION', value: data.profile?.hd_definition || '' },
  ].filter(s => s.value)

  const CoverPage = () => (
    <Page size="A4" style={S.coverPage}>
      <View style={S.coverTopStripe} />
      <View style={S.coverBody}>
        <Text style={S.coverBrand}>L U M I N A R Y</Text>
        <Text style={S.coverTitle}>Human Design</Text>
        <Text style={S.coverSubtitle}>Personal Reading</Text>
        <View style={S.coverRule} />
        <Text style={S.coverName}>{name}</Text>
        {stats.length > 0 && (
          <View style={S.coverStatsRow}>
            {stats.map((stat, i) => (
              <View key={stat.label} style={[S.coverStatItem, i < stats.length - 1 ? S.coverStatDivider : {}]}>
                <Text style={S.coverStatLabel}>{stat.label}</Text>
                <Text style={S.coverStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        )}
        {data.profile?.hd_incarnation_cross && (
          <Text style={S.coverCross}>{data.profile.hd_incarnation_cross}</Text>
        )}
        <Text style={S.coverDate}>{dateStr}</Text>
      </View>
      <View style={S.coverBottomStripe} />
    </Page>
  )

  // ── Contents page ──────────────────────────────────────────
  const contentsItems = [
    { label: 'Introduction to Human Design', note: 'What this system is' },
    { label: 'Your Body Graph',              note: 'Visual chart of your design' },
    { label: 'Your Reading',                 note: 'Personalized introduction' },
    { label: 'Your Type',                    note: data.profile?.hd_type || '' },
    { label: 'Your Inner Authority',         note: data.profile?.hd_authority || '' },
    { label: 'Your Profile',                 note: data.profile?.hd_profile || '' },
    { label: 'The Nine Centers',             note: 'All defined and open centers' },
    { label: 'Your Active Channels',         note: 'Fixed circuits of energy' },
    { label: 'Your Path Forward',            note: 'Closing reflection' },
  ]

  const ContentsPage = () => (
    <Page size="A4" style={S.page}>
      <PageHeader section="Contents" />
      <View style={S.content}>
        <Text style={S.contentsTitle}>Contents</Text>
        <Text style={S.contentsSub}>Your complete Human Design reading</Text>
        {contentsItems.map((item, i) => (
          <View key={i} style={S.contentsRow}>
            <Text style={S.contentsLabel}>{item.label}</Text>
            <Text style={S.contentsNote}>{item.note}</Text>
          </View>
        ))}
        <Text style={S.contentsFoot}>{'Prepared for ' + name + '  ·  ' + dateStr}</Text>
      </View>
      <PageFooter />
    </Page>
  )

  // ── Body Graph page ────────────────────────────────────────
  const BodyGraphPage = () => {
    if (!data.bodyGraphImage) return null
    return (
      <Page size="A4" style={S.page}>
        <PageHeader section="Your Body Graph" />
        <View style={S.sectionBar}>
          <Text style={S.sectionBarTitle}>YOUR BODY GRAPH</Text>
          <Text style={S.sectionBarSub}>
            {name}'s personal chart
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Image
            src={data.bodyGraphImage}
            style={{ width: 480, height: 480, objectFit: 'contain' }}
          />
        </View>
        <PageFooter />
      </Page>
    )
  }

  // ── Intro page ─────────────────────────────────────────────
  const IntroPage = () => (
    <Page size="A4" style={S.page}>
      <PageHeader section="Introduction to Human Design" />
      <View style={S.content}>
        <Text style={S.introLabel}>ABOUT THIS SYSTEM</Text>
        <Text style={S.introTitle}>What is Human Design?</Text>
        <Text style={S.introSub}>A brief introduction to the map you are about to explore</Text>
        <View style={S.introRule} />
        {INTRO_TO_HD.split('\n\n').map((para, i) => (
          <Text key={i} style={S.para}>{para}</Text>
        ))}
      </View>
      <PageFooter />
    </Page>
  )

  // ── Section page ───────────────────────────────────────────
  const SectionPage = ({ sectionKey }: { sectionKey: string }) => {
    const content = data.sections[sectionKey]
    if (!content) return null
    const blocks   = parseBlocks(content)
    const label    = SECTION_LABELS[sectionKey] || sectionKey
    const sublabel =
      sectionKey === 'type'      ? data.profile?.hd_type      :
      sectionKey === 'authority' ? data.profile?.hd_authority :
      sectionKey === 'profile'   ? data.profile?.hd_profile   :
      undefined
    return (
      <Page size="A4" style={S.page}>
        <PageHeader section={label} />
        <View style={S.sectionBar}>
          <Text style={S.sectionBarTitle}>{label.toUpperCase()}</Text>
          {sublabel && <Text style={S.sectionBarSub}>{sublabel}</Text>}
        </View>
        <View style={S.content}>
          {renderBlocks(blocks)}
        </View>
        <PageFooter />
      </Page>
    )
  }

  // ── Assemble document ──────────────────────────────────────
  const Report = () => (
    <Document
      title={'Human Design Reading — ' + name}
      author="Luminary"
      subject="Human Design Personal Reading"
    >
      <CoverPage />
      <ContentsPage />
      <IntroPage />
      <BodyGraphPage />
      {SECTION_ORDER.map(key =>
        data.sections[key]
          ? <SectionPage key={key} sectionKey={key} />
          : null
      )}
    </Document>
  )

  // ── Render to blob and trigger download ────────────────────
  const blob = await pdf(<Report />).toBlob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Luminary_HD_${name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
