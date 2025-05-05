"use client"
import React from 'react'
import { useState, useEffect } from 'react'

type CardType = {
    albumId: number;
    id: number;
    title: string;
    url: string;
    thumbnailUrl: string;
}


function Card() {
    const [cards, setCards] = useState<CardType[]>([]);

    useEffect (() => {
        const fetchData = async () => {
            try {
                const reponse = await fetch('https://jsonplaceholder.typicode.com/photos?_limit=10')
                const result = await reponse.json()
                setCards(result)
            }catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, []);

    console.log(cards)

  return (
    <>
        <div>
            <ul>
                {cards.map(val => (
                    <li key={val.id}>
                        <p>{val.title}</p>
                        <img src={val.url} alt="" />
                    </li>
                ))}
            </ul>
        </div>
    </>
  )
}

export default Card