import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import Navbar from '../../components/Navbar';

// Updated SectionCard to accept a 'path' prop
const SectionCard = ({ title, img, path }) => {
  const navigate = useNavigate(); // 2. Hook for navigation

  return (
    <div 
      onClick={() => navigate(path)} // 3. Redirect on click
      className="relative bg-white rounded-xl overflow-hidden shadow-md group cursor-pointer"
    >
      <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-center justify-center">
         <span className="text-white font-bold border-2 border-white px-4 py-2 uppercase tracking-widest">Explore</span>
      </div>

      <img src={img} className="h-48 w-full object-cover group-hover:scale-110 transition duration-500" alt={title} />
      
      <div className="p-6 relative z-0">
        <h3 className="text-xl font-bold text-blue-900">{title}</h3>
        <p className="text-gray-600 text-sm mt-2">Discover our commitment to excellence in {title.toLowerCase()}.</p>
      </div>
    </div>
  );
};

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate(); // 4. Hook for hero buttons

  // Fixed: Removed "Public/" from paths as Vite serves from public root
  const slides = [
    "Public/Campus images/Campus drone top.JPG",
    "Public/Campus images/Campus Library.jpg",
    "Public/Campus images/Campus roof.jpg"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <header className="relative h-[600px] flex items-center justify-center text-white overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-blue-900/50 z-10"></div>
            <img 
              src={slide} 
              className="w-full h-full object-cover" 
              alt={`Campus view ${index + 1}`} 
            />
          </div>
        ))}
        
        <div className="relative z-20 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
            Inspiring Excellence, Every Day
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md font-light">
            Digitizing the academic journey for students and faculty of BRAC University.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate('/academics')} // 5. Link View Programs
              className="bg-yellow-500 text-blue-900 px-8 py-3 rounded-md font-bold hover:bg-yellow-400 transition-colors shadow-lg"
            >
              View Programs
            </button>
            <button 
              onClick={() => navigate('/admission')} // 6. Link Apply Now
              className="border-2 border-white px-8 py-3 rounded-md font-bold hover:bg-white hover:text-blue-900 transition-all shadow-lg"
            >
              Apply Now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-blue-900 mb-12 text-center underline decoration-yellow-500 underline-offset-8">
          Our University at a Glance
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* 7. Pass the paths to the cards */}
          <SectionCard 
            title="Academics" 
            img="Public/Sectioncard images/Sectioncard academics.jpg" 
            path="/academics" 
          />
          <SectionCard 
            title="Research" 
            img="Public/Sectioncard images/Sectioncard research.jpg" 
            path="/research" 
          />
          <SectionCard 
            title="Student Life" 
            img="Public/Sectioncard images/Sectioncard studentlife.jpg" 
            path="/student-life" 
          />
        </div>
      </main>
    </div>
  );
};

export default Home;