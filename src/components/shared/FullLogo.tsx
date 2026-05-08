import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

const FullLogo = () => {
  return (
    <Link href='/' className='flex items-center gap-3'>
      {/* Lark icon */}
      <Image
        src="/images/logos/Lark.png"
        alt="FlowOffice"
        width={40}
        height={40}
        className="rounded-lg"
      />
      {/* FlowOffice text */}
      <span className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">FlowOffice</span>
    </Link>
  )
}

export default FullLogo

