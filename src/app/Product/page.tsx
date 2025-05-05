import React from 'react'
import Link from 'next/link'
import Navbar from '../component/Navbar'
import Card from './component/Card'
import Footer from '../component/Footer'

function page() {
  return (
    <>
      <Navbar />
      <div className='container mx-auto max-w-[1320px] flex flex-row'>
        <div className='basis-1/3'>
          <h1>ผลค้นหา</h1>
        </div>
        <div className='basis-2/3'>
          <Card/>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default page