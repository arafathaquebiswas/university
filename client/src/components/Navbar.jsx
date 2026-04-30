import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'ABOUT', path: '/about' },
    { name: 'ACADEMICS', path: '/academics' },
    { name: 'ADMISSION', path: '/admission' },
    { name: 'RESEARCH', path: '/research' },
    { name: 'STUDENT LIFE', path: '/student-life' },
    { name: 'ANNOUNCEMENTS', path: '/announcements' }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center space-x-3">
          <img src="/Public/Logos/braculogo.png" alt="BRACU Logo" className="h-12 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-blue-900 text-md leading-tight uppercase">BRAC University</span>
            <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">Portal</span>
          </div>
        </Link>

        {/* Desktop Navigation (Hidden on mobile) */}
        <div className="hidden lg:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="text-gray-600 hover:text-blue-900 font-semibold text-sm transition-colors duration-300">
              {link.name}
            </Link>
          ))}
          <Link to="/login" className="bg-blue-900 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors duration-300 shadow-md">
            LOGIN
          </Link>
        </div>

        {/* Hamburger Icon (Hidden on desktop) */}
        <div className="lg:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-blue-900 focus:outline-none p-2"
          >
            <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
              {isOpen ? (
                <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z" />
              ) : (
                <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:hidden bg-white border-t border-gray-100`}>
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              onClick={() => setIsOpen(false)} // Close menu on click
              className="block px-3 py-4 text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-md transition duration-300"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            to="/login" 
            onClick={() => setIsOpen(false)}
            className="block w-full text-center bg-blue-900 text-white px-6 py-4 rounded font-bold hover:bg-blue-700 transition duration-300"
          >
            LOGIN
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;