import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { appConfig } from '@/config/app.config'

const FullLogo = () => {
  return (
    <Link href='/' className='flex items-center gap-3'>
      <Image
        src={appConfig.logoPath}
        alt={appConfig.name}
        width={40}
        height={40}
        className="rounded-lg"
      />
      <span className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">{appConfig.name}</span>
    </Link>
  )
}

export default FullLogo

