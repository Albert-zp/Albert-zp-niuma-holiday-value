import QRCode from 'qrcode'
import { formatNumber, type HolidayInput, type HolidayResult } from './calculator'

const C = { bg: '#F7F2E8', text: '#20201D', muted: '#817B71', line: '#D8D0C4', orange: '#D77A36', teal: '#4F7168', red: '#C94F3D', surface: '#FBF8F1' }

export async function makeShareCard(input: HolidayInput, result: HolidayResult): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1440
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable')
  const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h) }
  const txt = (s: string, x: number, y: number, size: number, color = C.text, weight = 400, align: CanvasTextAlign = 'left') => {
    ctx.fillStyle = color
    ctx.font = `${weight} ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`
    ctx.textAlign = align
    ctx.fillText(s, x, y)
  }
  rect(0, 0, 1080, 1440, C.bg)
  rect(0, 0, 1080, 18, C.orange)
  rect(72, 66, 72, 72, C.red)
  txt('休', 108, 118, 42, '#fff', 700, 'center')
  txt('牛马假期含金量', 166, 119, 36, C.text, 700)
  txt('HOLIDAY VALUE', 1006, 110, 22, C.muted, 600, 'right')
  rect(72, 166, 936, 2, C.line)

  txt('我的假期含金量', 72, 260, 40, C.text, 600)
  txt(`${Math.round(result.holidayValuePercent)}%`, 62, 492, 228, C.orange, 800)
  txt('清醒的假期里，有多少时间真正由你支配', 76, 558, 27, C.muted)
  rect(72, 600, 936, 22, '#E8E0D5')
  rect(72, 600, 936 * result.holidayValuePercent / 100, 22, C.orange)

  txt('名义假期', 72, 705, 27, C.muted)
  txt(`${formatNumber(input.holidayDays)}天`, 72, 773, 64, C.text, 700)
  txt('真正自由', 565, 705, 27, C.muted)
  txt(`约${formatNumber(result.effectiveHolidayDays)}天`, 565, 773, 64, C.orange, 700)
  rect(72, 817, 936, 2, C.line)

  txt('时间账本', 72, 888, 33, C.text, 700)
  const ledger = [
    ['赶路 / 堵车', input.travelHours, C.text],
    ['非自由安排', input.obligationHours, C.text],
    ['公司拿走', result.companyHours, C.red],
  ] as const
  ledger.forEach(([label, hours, color], i) => {
    const y = 956 + i * 64
    txt(label, 72, y, 28, C.muted)
    txt(`${formatNumber(hours)}h`, 1008, y, 32, color, 700, 'right')
  })

  if (result.leaveLeverage !== null) {
    rect(72, 1128, 936, 80, '#DDE7E2')
    txt(`${input.annualLeaveDays}天年假 → ${input.holidayDays}天连休`, 98, 1179, 31, C.teal, 700)
    txt(`年假杠杆 ${result.leaveLeverage.toFixed(1)}×`, 980, 1179, 27, C.teal, 700, 'right')
  } else {
    rect(72, 1128, 936, 2, C.line)
  }

  txt(result.companyHours > 0 ? '放假归放假，班是一点没少惦记你。' : '这次假期，公司居然真的没找你。', 72, 1264, 30, C.text, 600)
  txt('假期是自己的，先把账算明白。', 72, 1310, 24, C.muted)

  const qr = document.createElement('canvas')
  const shareUrl = new URL(window.location.href)
  shareUrl.search = ''
  shareUrl.hash = ''
  await QRCode.toCanvas(qr, shareUrl.toString(), { width: 166, margin: 1, errorCorrectionLevel: 'M', color: { dark: C.text, light: C.surface } })
  rect(830, 1236, 178, 178, C.surface)
  ctx.drawImage(qr, 836, 1242, 166, 166)
  txt('扫码算算你的假期含金量', 72, 1394, 24, C.muted)
  return canvas.toDataURL('image/png')
}
