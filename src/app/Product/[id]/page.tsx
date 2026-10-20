import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '../../component/Navbar'
import Footer from '../../component/Footer'
import { getPublicProduct } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })

async function page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const product = await getPublicProduct(id)
  if (!product) notFound()

  return (
    <>
      <Navbar />
      <div className='container mx-auto max-w-5xl p-4 md:p-8'>
        <Link href='/Product' className='text-sm text-blue-600'>‹ กลับไปหน้าสินค้า</Link>
        <div className='mt-4 flex flex-col md:flex-row gap-8'>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className='w-full md:w-1/2 rounded-lg shadow-lg object-cover' />
          ) : (
            <div className='w-full md:w-1/2 aspect-square rounded-lg bg-gray-200' />
          )}
          <div className='md:w-1/2 space-y-4'>
            <h1 className='text-3xl font-bold'>{product.name}</h1>
            <p className='text-2xl font-bold text-blue-600'>{money.format(Number(product.price))}</p>
            <p className={product.stock > 0 ? 'text-green-700' : 'text-red-600'}>
              {product.stock > 0 ? `มีสินค้า (${product.stock} ชิ้น)` : 'สินค้าหมด'}
            </p>
            {product.description && <p className='whitespace-pre-line text-gray-700'>{product.description}</p>}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default page
