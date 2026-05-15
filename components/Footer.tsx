import React from 'react';
import { EXTERNAL_LINKS } from '../constants';
import { View } from '../types';

interface FooterProps {
  navigate: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, view: View) => {
    e.preventDefault();
    navigate(view);
  };

  return (
    <footer className="bg-gray-900 border-t border-slate-800 py-6">
      <div className="container mx-auto text-center text-slate-400 text-sm">
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-4">
          <a href="#" onClick={(e) => handleNavClick(e, 'about')} className="hover:text-indigo-400 transition-colors">من نحن</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'terms')} className="hover:text-indigo-400 transition-colors">اتفاقية الاستخدام</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'privacy')} className="hover:text-indigo-400 transition-colors">سياسة الخصوصية</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'contact')} className="hover:text-indigo-400 transition-colors">اتصل بنا</a>
          <a
            href={EXTERNAL_LINKS.wordpress}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            WordPress
          </a>
          <a
            href={EXTERNAL_LINKS.blogspot}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            Blogspot
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} AI ideas. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
};

export default Footer;