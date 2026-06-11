import type {Metadata} from 'next';
import { Cinzel_Decorative, Cormorant_Garamond } from 'next/font/google';
import './globals.css'; // Global styles

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cinzel',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: 'Convite Real - Princesa Eloá',
  description: 'Convite Digital Premium para a celebração de 5 anos da Princesa Eloá.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${cinzelDecorative.variable} ${cormorantGaramond.variable}`}>
      <body className="bg-[#F7F3EE] text-[#5A2D82] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

