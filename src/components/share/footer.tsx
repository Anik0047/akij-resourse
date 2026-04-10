import React from 'react';
import Image from 'next/image';
import { Mail, PhoneCall } from 'lucide-react';

const Footer = () => {
  return (
    <div className='max-w-350 mx-auto w-full md:h-20 text-white flex md:items-center justify-between flex-col md:flex-row gap-4 px-4 p-4'>
      <div className='flex md:items-center flex-col md:flex-row gap-4'>
        <span>Powered by</span>
        <div>
          <Image
            src='/logo-white.png'
            alt='Logo'
            width={100}
            height={100}
            className='h-8 w-29'
          />
        </div>
      </div>
      <div className='flex md:items-center md:justify-between flex-col md:flex-row gap-3 md:gap-6'>
        <span>Helpline</span>
        <a
          href='tel:+8801102020505'
          className='flex items-center md:justify-between gap-2 hover:opacity-80 transition-opacity'
        >
          <PhoneCall />
          <span>+88 011020202505</span>
        </a>
        <a
          href='mailto:support@akij.work'
          className='flex items-center md:justify-between gap-2 hover:opacity-80 transition-opacity'
        >
          <Mail />
          <span>support@akij.work</span>
        </a>
      </div>
    </div>
  );
};

export default Footer;
