"use client"
import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-15">
            <div className="container mx-auto text-center">
                <p>&copy; 2023 MyShop. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-2">
                    <a href="#" className="text-gray-400 hover:text-blue-400">Facebook</a>
                    <a href="#" className="text-gray-400 hover:text-blue-400">Twitter</a>
                    <a href="#" className="text-gray-400 hover:text-blue-400">Instagram</a>
                </div>
            </div>
        </footer>
    )
}
export default Footer;
