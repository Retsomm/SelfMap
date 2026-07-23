export const downloadChart = async (el: HTMLElement): Promise<void> => {
  try {
    const [{ toPng }, jspdfMod] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ])
    const { jsPDF } = jspdfMod

    const pad = 24
    const a4W = 210
    const footerH = 4
    // 讀取當下實際套用的主題色，而不是寫死淺色——
    // 內層面板/文字（--paper-deep、--ink 等）本來就會跟著即時主題渲染，
    // 只有這個最外層背景跟 PDF 頁尾以前寫死淺色，深色主題下載時才會混色、頁尾留白突兀
    const rootStyle = getComputedStyle(document.documentElement)
    const paperColor = rootStyle.getPropertyValue('--paper').trim() || '#efe5d0'
    const paperDeepColor = rootStyle.getPropertyValue('--paper-deep').trim() || '#e7d9bd'
    const inkColor = rootStyle.getPropertyValue('--ink').trim() || '#2b1f14'
    const inkSoftColor = rootStyle.getPropertyValue('--ink-soft').trim() || '#6b5a44'
    const hexToRgb = (hex: string): [number, number, number] => {
      const m = hex.replace('#', '').match(/.{1,2}/g)
      return m ? [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)] : [0, 0, 0]
    }
    const isExcluded = (node: Element) => {
      if (!node.classList) return false
      if (node.classList.contains('hd-print-hide')) return true
      if (node.tagName?.toLowerCase() === 'nav') return true
      return false
    }

    // el.offsetHeight 量的是「目前實際畫面」的高度，會把 hd-print-hide（例如下面的操作按鈕列）
    // 這種之後會被 filter 排除、不會畫進圖裡的區塊也算進去，導致畫布留了一大塊從沒填過內容的空白。
    // 量測前先暫時把這些區塊藏起來，讓量到的高度跟實際畫出來的內容一致。
    const excludedEls = Array.from(el.querySelectorAll('*')).filter(isExcluded) as HTMLElement[]
    const prevDisplay = excludedEls.map(e => e.style.display)
    excludedEls.forEach(e => { e.style.display = 'none' })
    const measuredWidth = el.offsetWidth
    const measuredHeight = el.offsetHeight
    excludedEls.forEach((e, i) => { e.style.display = prevDisplay[i] })

    // 圖表圖片最後會整張等比縮放成寬度 a4W(mm) 貼進 PDF，所以「圖表底部留白」要換算成
    // 跟頁尾一樣高（footerH mm），得先反推這張圖在 PDF 裡的縮放比例，
    // 才能算出對應的像素內距，而不是直接套用 footerH 的數字（單位不同，直接套會差很多）
    const imageWidthPx = measuredWidth + pad * 2
    const padBottom = footerH * (imageWidthPx / a4W)

    const dataUrl = await toPng(el, {
      pixelRatio: 3,
      backgroundColor: paperColor,
      width: measuredWidth + pad * 2,
      height: measuredHeight + pad + padBottom,
      style: {
        overflow: 'visible',
        maxWidth: 'none',
        padding: `${pad}px ${pad}px ${padBottom}px ${pad}px`,
        boxSizing: 'border-box',
      },
      filter: (node) => !isExcluded(node as Element),
    })

    const img = new Image()
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl })
    const contentH = (img.naturalHeight / img.naturalWidth) * a4W

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [a4W, contentH + footerH],
    })
    pdf.addImage(dataUrl, 'PNG', 0, 0, a4W, contentH)
    // 頁尾用 --paper-deep（跟圖表區的 --paper 有色階區隔）+ 頂部一條 --ink 邊框線，
    // 避免深色主題下露出 jsPDF 預設白色頁尾、也讓商標跟圖表區有清楚分界
    pdf.setFillColor(...hexToRgb(paperDeepColor))
    pdf.rect(0, contentH, a4W, footerH, 'F')
    pdf.setDrawColor(...hexToRgb(inkColor))
    pdf.setLineWidth(0.2)
    pdf.line(0, contentH, a4W, contentH)
    pdf.setFontSize(8)
    pdf.setTextColor(...hexToRgb(inkSoftColor))
    pdf.text(
      '© Retsnom',
      a4W / 2,
      contentH + footerH / 2,
      { align: 'center', baseline: 'middle' },
    )
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    pdf.save(`人類圖${ts}.pdf`)
  } catch (err) {
    console.error('[downloadChart]', err)
    throw new Error('Failed to export chart. Please try again or contact support.', { cause: err })
  }
}
