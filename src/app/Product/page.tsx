import React from 'react'
import Link from 'next/link'
import Navbar from '../component/Navbar'
import Card from '../component/Card'
import Footer from '../component/Footer'
import { listPublicProducts } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

async function page({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, Number.parseInt(page) || 1)
  const { products, total } = await listPublicProducts({ q, limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE })
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageHref = (p: number) => `/Product?${new URLSearchParams({ q, page: String(p) })}`

  return (
    <>
      <Navbar />
      <div className='container mx-auto max-w-[1320px] flex flex-col md:flex-row gap-4 p-4'>
        <div className='md:basis-1/3'>
          <h1 className='text-xl font-bold mb-4'>ผลค้นหา</h1>
          <form className='flex gap-2'>
            <input
              name='q'
              defaultValue={q}
              placeholder='ค้นหาสินค้า'
              className='w-full rounded-md border border-gray-300 px-3 py-2'
            />
            <button className='rounded-md bg-gray-800 px-4 py-2 text-white'>ค้นหา</button>
          </form>
          <p className='mt-2 text-sm text-gray-500'>พบ {total} รายการ</p>
        </div>
        <div className='md:basis-2/3'>
          <Card products={products} />
          {pages > 1 && (
            <div className='flex items-center justify-center gap-4 text-sm pb-8'>
              {pageNum > 1 && <Link href={pageHref(pageNum - 1)} className='text-blue-600'>‹ ก่อนหน้า</Link>}
              <span>หน้า {pageNum} / {pages}</span>
              {pageNum < pages && <Link href={pageHref(pageNum + 1)} className='text-blue-600'>ถัดไป ›</Link>}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default page
