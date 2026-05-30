export const LoadingSpinner = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <svg
      className="animate-spin"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="23.562"
        className="text-(--ink-soft)"
      />
    </svg>
  </div>
)
