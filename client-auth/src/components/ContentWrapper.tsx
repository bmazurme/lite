// import React from 'react';
import type { PropsWithChildren } from 'react';

// import Header from '../header';
// import Footer from '../footer';

export default function ContentWrapper({ children }: PropsWithChildren) {
  return (
    <main id="center">
      {/* <Header /> */}
      {children}
      {/* <Footer /> */}
    </main>
  );
}
