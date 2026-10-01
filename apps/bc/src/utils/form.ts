export const appendForm = () => {
  const script = document.createElement('script')
  script.src = 'https://embed.typeform.com/next/embed.js'
  script.async = true
  document.body.appendChild(script)
  return () => {
    document.body.removeChild(script)
  }
}
