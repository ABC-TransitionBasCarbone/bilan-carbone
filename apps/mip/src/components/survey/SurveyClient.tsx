'use client'
import dynamic from 'next/dynamic'

const Survey = dynamic(() => import('./Survey'), { ssr: false })

export default Survey
