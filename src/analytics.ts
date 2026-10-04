export type EventName = 'page_view' | 'start_calculate' | 'calculate_complete' | 'view_result' | 'generate_share' | 'save_share' | 'select_holiday_preset'

type EventPayload = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, payload?: EventPayload) => void
    _hmt?: Array<Array<string>>
  }
}

let firstPageView = true

// One adapter point for replacing the analytics provider later.
export function track(name: EventName, payload: EventPayload = {}) {
  window.gtag?.('event', name, payload)
  if (name === 'page_view') {
    // Baidu automatically records the initial document load.
    if (!firstPageView) {
      const page = payload.page === 'input' || payload.page === 'result' ? payload.page : ''
      window._hmt?.push(['_trackPageview', page ? `/${page}` : '/'])
    }
    firstPageView = false
  } else {
    window._hmt?.push(['_trackEvent', 'holiday_value', name, JSON.stringify(payload)])
  }
  window.dispatchEvent(new CustomEvent('holiday-value-analytics', { detail: { name, payload } }))
  if (import.meta.env.DEV) console.info('[analytics]', name, payload)
}
