'use client';
import React from 'react';
import Carousel from './component/Carousel';
import Card from '../component/Card';

type Hero = {
  id: number;
  image: string;
  title: string;
  content: string;
}
type Catagory = {
  id: number;
  image: string;
  title: string;
}

const hero: Hero[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Hero Section',
    content: 'lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  }
]

const catagories: Catagory[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Catagory 1'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Catagory 2'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Catagory 3'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Catagory 4'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Catagory 5'
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Catagory 6'
  }
]

const Body: React.FC = () => {
  return (
    <>
      <Carousel />
        <div className='container mx-auto flex flex-col  items-center '>
          <div className='text-center p-8'>
            <h2 className='text-2xl font-bold'>เกี่ยวกับเรา</h2>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col md:flex-row justify-center overflow-hidden p-8 w-full max-w-7xl">
            <img src={hero[0].image} alt={hero[0].title} className="h-90 md:w-1/2 object-cover shadow-lg rounded-lg" />
            <div className="w-full p-6 text-left">
              <h3 className="text-2xl font-semibold mb-4 text-center">{hero[0].title}</h3>
              <p className="text-gray-700 tab-size-4">{hero[0].content}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-15'>
            {catagories.map(catagory => (
              <div key={catagory.id} className='items-center mx-4'>
                <img src={catagory.image} alt={catagory.title} className='h-32 w-32 object-cover rounded-full shadow-lg mb-2' />
                <h3 className='text-center text-xl font-medium'>{catagory.title}</h3>
              </div>
            ))}
          </div>

          <div className='text-center p-8'>
            <h2 className='text-2xl font-bold'>สินค้าแนะนำ</h2>
              <Card />
          </div>
        </div>
    </>
  )
}
export default Body;
