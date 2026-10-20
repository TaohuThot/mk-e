import React from 'react'
import Link from 'next/link'
import type { PublicProduct } from '@/lib/storefront'

const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })

type Props = { products: PublicProduct[] }

function Card({ products }: Props) {
  if (products.length === 0) {
    return <p className='p-8 text-center text-gray-500'>ยังไม่มีสินค้า</p>
  }
  return (
    <>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8 max-w-5xl'>
            {products.map(product => (
              <Link
                key={product.id}
                href={`/Product/${product.id}`}
                className='bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow'
              >
                {product.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.thumbnailUrl} alt={product.name} loading='lazy' className='w-full h-48 object-cover' />
                ) : (
                  <div className='w-full h-48 bg-gray-200' />
                )}
                <div className='p-4 text-center'>
                  <h3 className='text-lg font-semibold line-clamp-2'>{product.name}</h3>
                  <p className='text-blue-600 font-bold'>{money.format(Number(product.price))}</p>
                  {product.stock <= 0 && <p className='text-sm text-red-600'>สินค้าหมด</p>}
                </div>
              </Link>
            ))}
        </div>
    </>
  )
}

export default Card
