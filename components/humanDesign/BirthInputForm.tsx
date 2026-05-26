interface Props {
  date: string
  time: string
  offset: number
  loading: boolean
  onDateChange: (v: string) => void
  onTimeChange: (v: string) => void
  onOffsetChange: (v: number) => void
  onCalculate: () => void
}

const BirthInputForm = ({
  date, time, offset, loading,
  onDateChange, onTimeChange, onOffsetChange, onCalculate,
}: Props) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCalculate()
  }

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const parsed = Number(value)
    if (value === '' || !Number.isFinite(parsed)) {
      onOffsetChange(0)
    } else {
      onOffsetChange(parsed)
    }
  }

  return (
    <section className="bg-gray-900 rounded-xl p-6 mb-8 max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-400 text-sm">出生日期</span>
            <input
              type="date"
              value={date}
              onChange={e => onDateChange(e.target.value)}
              className="bg-gray-800 rounded px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400 text-sm">出生時間（本地）</span>
            <input
              type="time"
              value={time}
              onChange={e => onTimeChange(e.target.value)}
              className="bg-gray-800 rounded px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400 text-sm">時區（UTC+?）</span>
            <input
              type="number"
              value={offset}
              onChange={handleOffsetChange}
              min={-12}
              max={14}
              step={0.5}
              className="bg-gray-800 rounded px-3 py-2 text-white"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg py-2 font-semibold transition-colors"
        >
          {loading ? '計算中...' : '計算行星位置'}
        </button>
      </form>
    </section>
  )
}

export default BirthInputForm
