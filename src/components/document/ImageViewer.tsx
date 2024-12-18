import Image from 'next/image'

interface Props {
  alt: string
  url: string
  className?: string
}

const ImageViewer = ({ url, alt, className }: Props) => (
  <Image className={className} src={url} alt={alt} width={0} height={0} layout="responsive" />
)

export default ImageViewer
