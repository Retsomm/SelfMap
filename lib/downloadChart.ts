export const downloadChart = async (el: HTMLElement): Promise<void> => {
  const [{ toPng }, { default: jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ])

  const prevScrollY = window.scrollY
  window.scrollTo(0, 0)
  await new Promise<void>(r => requestAnimationFrame(() => { requestAnimationFrame(() => r()) }))

  const dataUrl = await toPng(el, {
    pixelRatio: 3,
    backgroundColor: '#efe5d0',
    filter: (node) => {
      const el = node as Element
      if (!el.classList) return true
      if (el.classList.contains('hd-print-hide')) return false
      if (el.tagName?.toLowerCase() === 'nav') return false
      return true
    },
  })

  window.scrollTo(0, prevScrollY)

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
}
