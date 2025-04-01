'use client';
import React from 'react'

type Hero = {
  id: number;
  image: string;
  title: string;
  content: string;
}
type Card = {
  id: number;
  image: string;
  title: string;
  content: string;
}

const hero: Hero[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Hero Section',
    content: 'lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  }
]

const cards: Card[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Card 1',
    content: 'Content for Card 1'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Card 2',
    content: 'Content for Card 2'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Card 3',
    content: 'Content for Card 3'
  },
]

const Body: React.FC = () => {
  return (
    <div className='container mx-auto flex flex-col items-center'>
      <div className='text-center p-8'>
        <h2 className='text-2xl font-bold'>เกี่ยวกับเรา</h2>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-center overflow-hidden p-8 w-full max-w-7xl">
        <img src={hero[0].image} alt={hero[0].title} className="w-200 h-100 md:w-1/2 object-cover rounded-lg" />
        <div className="w-full md:w-1/2 f p-6 text-let">
          <h3 className="text-2xl font-semibold mb-40000000000000000000000000000000000008">{hero[0].title}</h3>
          <p className="text-gray-700 ">{hero[0].content}</p>
        </div>
      </div>

      <div className='text-center p-8'>
        <h2 className='text-2xl font-bold'>สินค้าแนะนำ</h2>
      </div>

      {/* Cards Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8 w-full max-w-5xl'>
        {cards.map(card => (
          <div key={card.id} className='bg-white shadow-lg rounded-lg overflow-hidden'>
            <img src={card.image} alt={card.title} className='w-full h-48 object-cover' />
            <div className='p-4 text-center'>
              <h3 className='text-xl font-semibold'>{card.title}</h3>
              <p className='text-gray-700'>{card.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default Body;
