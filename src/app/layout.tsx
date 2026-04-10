import type { Metadata } from 'next';
import { DM_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/share/navbar';
import Footer from '@/components/share/footer';
import BonesProvider from '@/components/providers/bones-provider';

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Online Assessment Platform',
  description:
    'Employer and candidate panel demo with multi-step exam workflows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className='min-h-screen flex flex-col bg-[#fdfbf8]'>
        <BonesProvider />
        <div className='w-full bg-white border-b border-zinc-100'>
          <Navbar />
        </div>
        {children}
        <div className='w-full bg-[#130B2C]'>
          <Footer />
        </div>
      </body>
    </html>
  );
}
