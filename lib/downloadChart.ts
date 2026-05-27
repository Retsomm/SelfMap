export const downloadChart = async (el: HTMLElement): Promise<void> => {
  try {
    const [{ toPng }, jspdfMod] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ])
    const { jsPDF } = jspdfMod

    const pad = 24
    const dataUrl = await toPng(el, {
      pixelRatio: 3,
      backgroundColor: '#efe5d0',
      width: el.offsetWidth + pad * 2,
      height: el.offsetHeight + pad * 2,
      style: {
        overflow: 'visible',
        maxWidth: 'none',
        padding: `${pad}px`,
        boxSizing: 'border-box',
      },
      filter: (node) => {
        const el = node as Element
        if (!el.classList) return true
        if (el.classList.contains('hd-print-hide')) return false
        if (el.tagName?.toLowerCase() === 'nav') return false
        return true
      },
    })

    const img = new Image()
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl })
    const a4W = 210
    const contentH = (img.naturalHeight / img.naturalWidth) * a4W

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [a4W, contentH],
    })
    pdf.addImage(dataUrl, 'PNG', 0, 0, a4W, contentH)
    pdf.save('human-design.pdf')
  } catch (err) {
    console.error('[downloadChart]', err)
    throw new Error('Failed to export chart. Please try again or contact support.', { cause: err })
  }
}
