import React from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function Layout({ children, currentPage, onPageChange }) {
  return (
    <div className="h-screen flex bg-slate-100">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
