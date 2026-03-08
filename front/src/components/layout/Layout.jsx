import React from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function Layout({ children, currentPage, onPageChange }) {
  return (
    <div className="h-screen flex bg-[#0a0a0a]">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-[#0e0e0e]">
          {children}
        </main>
      </div>
    </div>
  );
}
