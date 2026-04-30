import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

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

const categoryColors = {
  exam:         'bg-red-100 text-red-700 border-red-200',
  registration: 'bg-blue-100 text-blue-700 border-blue-200',
  holiday:      'bg-green-100 text-green-700 border-green-200',
  event:        'bg-purple-100 text-purple-700 border-purple-200',
  deadline:     'bg-orange-100 text-orange-700 border-orange-200',
};

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [importantDates, setImportantDates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    api.get('/admin/dates').then(r => setImportantDates(r.data)).catch(() => {});
    api.get('/public/announcements').then(r => setAnnouncements(r.data.slice(0, 3))).catch(() => {});
  }, []);

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

        {/* Important Dates */}
        {importantDates.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center underline decoration-yellow-500 underline-offset-8">
              Important Dates
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {importantDates.map(d => (
                <div key={d.dateId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 text-center">
                    <p className="text-2xl font-black text-blue-900 leading-none">
                      {new Date(d.eventDate).getUTCDate()}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      {new Date(d.eventDate).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(d.eventDate).getUTCFullYear()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border mb-1 capitalize ${categoryColors[d.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {d.category}
                    </span>
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{d.title}</p>
                    {d.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Announcements Preview */}
        {announcements.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <h2 className="text-3xl font-bold text-blue-900 underline decoration-yellow-500 underline-offset-8">
                Latest Announcements
              </h2>
              <button
                onClick={() => navigate('/announcements')}
                className="text-blue-900 font-semibold border-2 border-blue-900 px-5 py-2 rounded hover:bg-blue-900 hover:text-white transition-colors text-sm"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.announcementId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <h3 className="text-lg font-bold text-blue-900">{a.title}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap pt-1">
                      {new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/announcements')}
                className="bg-blue-900 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                See All Announcements
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;