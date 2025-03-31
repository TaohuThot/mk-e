'use client';
import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-gray-800 p-7">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-semibold">
          <a href="#">MyShop</a>
        </div>
        
        <div className="hidden md:flex space-x-6 ">
          <a href="src\app\component\Product.tsx" className="text-white hover:text-blue-400 mr-10">หน้าแรก</a>
          <a href="#" className="text-white hover:text-blue-400 mr-10">สินค้า</a>
          <a href="#" className="text-white hover:text-blue-400 mr-10">เกี่ยวกับเรา</a>
          <a href="#" className="text-white hover:text-blue-400 mr-10">ช่องทางติดต่อ</a>
        </div>

        <div className="md:hidden flex items-center">
          <button onClick={toggleMenu} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden flex flex-col space-y-4 mt-4">
          <a href="#" className="text-white hover:text-blue-400">หน้าแรก</a>
          <a href="#" className="text-white hover:text-blue-400">สินค้า</a>
          <a href="#" className="text-white hover:text-blue-400">เกี่ยวกับเรา</a>
          <a href="#" className="text-white hover:text-blue-400">ช่องทางติดต่อ</a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
