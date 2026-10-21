import NextImage, { ImageProps } from 'next/image'

const Image = ({ alt, ...props }: ImageProps) => <NextImage {...props} alt={alt} style={{ color: undefined }} />

export default Image
