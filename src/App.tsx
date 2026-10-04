import { useEffect, useLayoutEffect, useState } from 'react'
import { track } from './analytics'
import { calculate, formatNumber, holidayPresets, resultLine, validateInput, type HolidayInput, type HolidayResult, type PresetId } from './calculator'
import { makeShareCard } from './share'
import { loadState, saveState } from './storage'

type Page = 'home' | 'input' | 'result'
const presetIds: PresetId[] = ['national_day', 'leave3_13', 'custom']

function Brand() {
  return <div className="brand"><span className="seal">休</span><div><strong>牛马假期含金量</strong><small>HOLIDAY VALUE</small></div></div>
}

function HourField({ number, title, detail, options, value, onChange, featured = false }: {
  number: string; title: string; detail?: string; options: number[]; value: number; onChange: (value: number) => void; featured?: boolean
}) {
  return <section className={`question ${featured ? 'question-featured' : ''}`}>
    <div className="question-head"><span className="question-index">{number}</span><h2>{title}</h2></div>
    {detail && <p className="hint">{detail}</p>}
    <div className="chip-row">
      {options.map(n => <button className={`chip ${value === n ? 'selected' : ''}`} key={n} type="button" onClick={() => onChange(n)}>{n === 0 ? '0' : `${n}h`}</button>)}
    </div>
    <label className="custom-hour"><span>自定义</span><input aria-label={`${title}自定义小时`} type="number" min="0" max="8760" step="0.5" inputMode="decimal" value={Number.isFinite(value) ? value : ''} onChange={e => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))} /><span>小时</span></label>
  </section>
}

function App() {
  const [saved] = useState(loadState)
  const [input, setInput] = useState<HolidayInput>(saved.input)
  const [result, setResult] = useState<HolidayResult | null>(saved.result)
  const [resultInput, setResultInput] = useState<HolidayInput | null>(saved.resultInput)
  const [page, setPage] = useState<Page>('home')
  const [error, setError] = useState('')
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [shareBusy, setShareBusy] = useState(false)
  const shownInput = page === 'result' && resultInput ? resultInput : input

  useEffect(() => { track('page_view', { page }) }, [page])
  useEffect(() => { saveState({ input, result, resultInput }) }, [input, result, resultInput])
  useLayoutEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    scrollToTop()
    const frame = requestAnimationFrame(scrollToTop)
    return () => cancelAnimationFrame(frame)
  }, [page])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setShareImage(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const update = (patch: Partial<HolidayInput>) => { setInput(prev => ({ ...prev, ...patch })); setError('') }
  const selectPreset = (preset: PresetId) => {
    const config = holidayPresets[preset]
    update({ preset, holidayDays: config.holidayDays, annualLeaveDays: config.annualLeaveDays })
    track('select_holiday_preset', { preset })
  }
  const start = () => { track('start_calculate'); setPage('input') }
  const submit = () => {
    const message = validateInput(input)
    if (message) { setError(message); return }
    const calculated = calculate(input)
    setResult(calculated)
    setResultInput(input)
    saveState({ input, result: calculated, resultInput: input })
    track('calculate_complete', { preset: input.preset, holiday_value_percent: Math.round(calculated.holidayValuePercent) })
    setPage('result')
    track('view_result', { preset: input.preset })
  }
  const share = async () => {
    if (!result || shareBusy) return
    setShareBusy(true)
    try {
      const image = await makeShareCard(shownInput, result)
      setShareImage(image)
      track('generate_share')
    } catch { setError('分享图生成失败，请稍后重试。') }
    finally { setShareBusy(false) }
  }
  const saveImage = () => {
    if (!shareImage) return
    const a = document.createElement('a')
    a.href = shareImage
    a.download = '牛马假期含金量.png'
    a.click()
    track('save_share')
  }

  return <div className="app-shell">
    <header className={`site-header ${page === 'home' ? 'home-site-header' : ''}`}><Brand /><span className="header-mark">把假期还给自己</span></header>
    {page === 'home' && <main className="home">
      <div className="home-topline"><div className="home-brand"><span className="home-seal">休</span><span>牛马假期含金量</span></div><div className="eyebrow"><span className="eyebrow-line" />HOLIDAY VALUE / 2026</div></div>
      <div className="home-art" aria-hidden="true"><span className="sun" /><span className="sun-cut" /><span className="horizon horizon-one" /><span className="horizon horizon-two" /></div>
      <div className="home-copy">
        <span className="hot-tag">2026 中秋国庆 · 请3休13</span>
        <h1>你以为休了<span>13天，</span><br />真正属于自己的<br />有几天？</h1>
        <p>赶路、走亲戚、带娃，<br />再加上公司临时拉的会，<br />都扣掉以后再看看。</p>
        <button className="primary-button home-cta" onClick={start}>算算我的假期含金量 <span>↗</span></button>
        <div className="under-cta">不用登录 <i /> 10秒左右算完</div>
        {result && <button className="previous-result" onClick={() => { setPage('result'); track('view_result', { source: 'saved' }) }}>查看上次结果 →</button>}
      </div>
      <div className="home-footer"><span>01 / 时间账本</span><span>清醒的每小时，都算数。</span></div>
    </main>}

    {page === 'input' && <main className="content input-page">
      <button className="text-back" onClick={() => setPage('home')}>← 返回首页</button>
      <div className="section-kicker">01 / 先把假期摊开</div>
      <h1>这次的假，<br /><em>到底怎么放？</em></h1>
      <p className="page-intro">填一个大概就好，最后算的是属于你自己的清醒时间。</p>

      <section className="preset-section"><div className="question-head"><span className="question-index">A</span><h2>这次怎么放？</h2></div>
        <div className="preset-grid">{presetIds.filter(id => holidayPresets[id].visible).map(id => <button type="button" className={`preset ${input.preset === id ? 'active' : ''}`} key={id} onClick={() => selectPreset(id)}><span className="preset-title">{holidayPresets[id].label}</span><span className="preset-detail">{holidayPresets[id].detail}</span><span className="preset-check">{input.preset === id ? '✓' : '↗'}</span></button>)}</div>
      </section>

      <section className="question"><div className="question-head"><span className="question-index">01</span><h2>这次一共休几天？</h2></div><div className="days-inputs"><label className="large-input"><input aria-label="连续休假天数" type="text" inputMode="numeric" pattern="[0-9]*" value={Number.isFinite(input.holidayDays) ? input.holidayDays : ''} onChange={e => update({ holidayDays: e.target.value === '' ? Number.NaN : Number(e.target.value), preset: 'custom' })} /><span>天</span></label><label className="leave-input"><span>其中使用年假</span><input aria-label="使用年假天数" type="number" inputMode="numeric" min="0" max="365" step="1" value={Number.isFinite(input.annualLeaveDays) ? input.annualLeaveDays : ''} onChange={e => update({ annualLeaveDays: e.target.value === '' ? Number.NaN : Number(e.target.value), preset: 'custom' })} /><span>天</span></label></div></section>
      <section className="question"><div className="question-head"><span className="question-index">02</span><h2>假期每天大概睡多久？</h2></div><p className="hint">睡觉不算浪费，含金量按清醒时间计算。</p><div className="chip-row">{[7, 8, 9, 10].map(n => <button type="button" key={n} className={`chip ${input.sleepHoursPerDay === n ? 'selected' : ''}`} onClick={() => update({ sleepHoursPerDay: n })}>{n}h</button>)}</div><label className="custom-hour"><span>自定义</span><input aria-label="每天睡眠小时" type="number" min="0" max="23.5" step="0.5" inputMode="decimal" value={Number.isFinite(input.sleepHoursPerDay) ? input.sleepHoursPerDay : ''} onChange={e => update({ sleepHoursPerDay: e.target.value === '' ? Number.NaN : Number(e.target.value) })} /><span>小时 / 天</span></label></section>
      <HourField number="03" title="这次来回路上要花多久？" detail="高铁、飞机、高速堵车、往返车站都可以算。" options={[0, 4, 8, 12, 24]} value={input.travelHours} onChange={n => update({ travelHours: n })} />
      <HourField number="04" title="有多少时间不是你自己能支配的？" detail="走亲戚、应酬、家务、带娃等都算在这里。" options={[0, 8, 16, 24, 40]} value={input.obligationHours} onChange={n => update({ obligationHours: n })} />
      <HourField number="05" title="都放假了，公司还开会吗？" options={[0, 0.5, 1, 2, 4]} value={input.meetingHours} onChange={n => update({ meetingHours: n })} featured />
      <HourField number="06" title="假期还要处理多久工作？" detail="回消息、改文档、处理紧急事情等。" options={[0, 1, 2, 4, 8]} value={input.workHours} onChange={n => update({ workHours: n })} featured />
      <div className="form-end">{error && <div className="error" role="alert">{error}</div>}<button className="primary-button" onClick={submit}>看看我的假到底值几天 <span>↗</span></button><p>只是一个时间账本，不评价睡觉、陪家人或其他安排值不值得。</p></div>
    </main>}

    {page === 'result' && result && <main className="content result-page">
      <button className="text-back" onClick={() => setPage('input')}>← 修改我的时间账本</button>
      <div className="section-kicker">02 / 你的假期结算单</div>
      <div className="result-hero"><div className="result-orbit" aria-hidden="true" /><span className="result-label">我的假期含金量</span><div className="result-percent">{Math.round(result.holidayValuePercent)}<span>%</span></div><div className="result-judgment">{resultLine(result.holidayValuePercent)}</div><div className="result-days"><div><small>名义上休</small><strong>{formatNumber(shownInput.holidayDays)}<span>天</span></strong></div><span className="result-arrow">→</span><div><small>折算自由假期</small><strong className="orange">约{formatNumber(result.effectiveHolidayDays)}<span>天</span></strong></div></div><div className="bar-label"><span>自由时间 {Math.round(result.holidayValuePercent)}%</span><span>被安排时间 {100 - Math.round(result.holidayValuePercent)}%</span></div><div className="progress"><span style={{ width: `${result.holidayValuePercent}%` }} /></div><p className="awake-note">按每天清醒{formatNumber(result.awakeHoursPerDay)}小时折算，睡眠不算损失。</p>{result.overfilled && <p className="overfilled">你的安排已经把清醒假期塞满了。</p>}</div>

      <section className="ledger-section"><div className="section-kicker">TIME LEDGER</div><h2>你的假，都去哪了？</h2><div className="ledger-row"><span>赶路 / 堵车</span><strong>−{formatNumber(shownInput.travelHours)}h</strong></div><div className="ledger-row"><span>走亲戚 / 家务 / 带娃</span><strong>−{formatNumber(shownInput.obligationHours)}h</strong></div><div className="ledger-row company-row"><span>公司会议</span><strong>−{formatNumber(shownInput.meetingHours)}h</strong></div><div className="ledger-row company-row"><span>临时工作</span><strong>−{formatNumber(shownInput.workHours)}h</strong></div><div className="ledger-total"><span>清醒假期 {formatNumber(result.awakeHolidayHours)}h</span><span>真正自由 {formatNumber(result.freeHours)}h</span></div></section>

      <section className={`company-section ${result.companyHours === 0 ? 'company-clean' : ''}`}><div className="section-kicker">COMPANY / 公司时间</div><h2>{result.companyHours > 0 ? '放假归放假，公司还是惦记你。' : '这次假期，公司居然真的没找你。'}</h2><div className="company-number">{formatNumber(result.companyHours)}<span>小时</span></div><p>{result.companyHours > 0 ? `这次假期被公司拿回去了 ${formatNumber(result.companyHours)} 小时` : '工作污染：0小时'}</p>{result.companyHours > 0 && <small>约 {result.companyDays.toFixed(1)} 个清醒假期日</small>}</section>

      {result.leaveLeverage !== null && <section className="leverage-section"><div className="section-kicker">ANNUAL LEAVE / 年假杠杆</div><div className="leverage-equation"><span>{shownInput.annualLeaveDays}<small>天年假</small></span><b>→</b><span>{shownInput.holidayDays}<small>天连休</small></span></div><div className="leverage-bottom"><strong>年假杠杆 {result.leaveLeverage.toFixed(1)}×</strong><span>{shownInput.preset === 'leave3_13' ? '这3天年假，确实花得值。' : '这段连休，安排得有点意思。'}</span></div></section>}

      <div className="result-actions">{error && <div className="error" role="alert">{error}</div>}<button className="primary-button" disabled={shareBusy} onClick={share}>{shareBusy ? '正在生成分享图…' : '生成我的假期分享卡'} <span>↗</span></button><button className="secondary-button" onClick={() => setPage('input')}>重新算一算</button></div>
      <p className="footnote">假期是自己的，先把账算明白。</p>
    </main>}

    {shareImage && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShareImage(null) }}><div className="share-modal" role="dialog" aria-modal="true" aria-label="假期分享卡"><div className="modal-top"><div><strong>你的假期分享卡</strong><small>预览与保存使用同一张图片</small></div><button className="modal-close" aria-label="关闭分享卡" onClick={() => setShareImage(null)}>×</button></div><div className="share-preview"><img src={shareImage} alt="我的假期含金量分享卡" /></div><div className="modal-actions"><button className="primary-button" onClick={saveImage}>保存图片 <span>↓</span></button><p>手机上也可长按图片保存</p></div></div></div>}
  </div>
}

export default App
