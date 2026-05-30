declare module '*.wasm' {
  const url: string
  export default url
}

interface Window {
  umami?: {
    track: (event: string, data?: Record<string, unknown>) => void
  }
}
