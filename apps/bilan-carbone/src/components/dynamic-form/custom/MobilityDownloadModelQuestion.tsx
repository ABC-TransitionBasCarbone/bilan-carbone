export const MobilityDownloadModelQuestion = () => {
  const contactMail = process.env.NEXT_PUBLIC_CUT_SUPPORT_EMAIL
  const contactMailSubject = 'Enqu%C3%AAte%20mobilit%C3%A9%20cin%C3%A9ma'
  const contactMailBody = `Bonjour%2C%20%0D%0AJe%20vous%20contacte%20car%20j'aimerais%20r%C3%A9aliser%20une%20enqu%C3%AAte%20mobilit%C3%A9%20pour%20connaitre%20l'impact%20des%20d%C3%A9placements%20des%20spectateurs%20de%20mon%20cin%C3%A9ma.%20%0D%0A%0D%0APouvez-vous%20me%20transmettre%20la%20proposition%20d'enqu%C3%AAte%20mobilit%C3%A9%20%3F`

  return (
    <div>
      Vous pouvez nous contacter à{' '}
      <a href={`mailto:${contactMail}?subject=${contactMailSubject}&body=${contactMailBody}`}>{contactMail}</a> pour
      recevoir une proposition d'enquête mobilité.
    </div>
  )
}
