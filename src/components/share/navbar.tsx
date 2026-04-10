import Image from 'next/image';
import React from 'react';

const Navbar = () => {
  return (
    <nav className='h-16 sm:h-20 px-4 flex items-center justify-between max-w-4xl mx-auto w-full'>
      <Image src='/logo.png' alt='Logo' width={100} height={50} />
      <h1 className='text-lg sm:text-2xl font-semibold'>Akij Resource</h1>
    </nav>
  );
};

export default Navbar;
