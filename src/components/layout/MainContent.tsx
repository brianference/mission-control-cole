import React from 'react';
import './MainContent.css';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="main-content" role="main">
      <div className="content-container">
        {children}
      </div>
    </main>
  );
};

export default MainContent;
