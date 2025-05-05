import React from 'react'

type Card = {
    id: number;
    image: string;
    title: string;
    content: string;
}

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
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1741851373559-6879db14fd8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      title: 'Card 4',
      content: 'Content for Card 4'
    },
  ]
  
function Card() {
  return (
    <>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-8  max-w-5xl'>
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
    </>
  )
}

export default Card