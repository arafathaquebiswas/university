import React from 'react';
import Navbar from '../../components/Navbar';

const StudentLife = () => {
  // Define your clubs here with potential image paths later
  const clubsList = [
    { name: "Robotics Club", type: "Technology", img: "Public/StudentLife/Club_robotics.jpg" }, 
    { name: "Debating Society", type: "Leadership", img: "Public/StudentLife/Club_Debate.jpg" },
    { name: "Cultural Club", type: "Arts", img: "Public/StudentLife/Club_cultural.jpg" },
    { name: "Indoor Games", type: "Athletics", img: "Public/StudentLife/Club_indoor.jpg" },
    { name: "Film Club", type: "Media", img: "Public/StudentLife/Club_film.jpg" },
    { name: "Art Club", type: "Art", img: "Public/StudentLife/Club_art.jpg" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/70 z-10" />
        <img 
          src="Public/StudentLife/studentlife.jpg" 
          alt="Student Life" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Student Life</h1>
          <p className="text-xl max-w-2xl mx-auto font-light">
            A dynamic blend of academic excellence, cultural diversity, and community engagement.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        
        {/* 1. Permanent Campus Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-blue-900 mb-6">Our New Permanent Campus</h2>
            <div className="h-1.5 w-20 bg-yellow-500 mb-8" />
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Located in Merul Badda, our new home is an architectural marvel designed for innovation. 
              The campus blends nature with modern technology, featuring high-tech classrooms, 
              collaborative zones, and sustainable green spaces that inspire exploration and growth.
            </p>
            <ul className="space-y-4">
              {['Sustainable Design', 'Modern Labs', 'Collaboration Zones', 'Green Environment'].map((item) => (
                <li key={item} className="flex items-center text-blue-900 font-bold">
                  <span className="bg-blue-100 p-1 rounded-full mr-3">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-100 rounded-3xl overflow-hidden shadow-2xl h-[450px]">
             <img src="Public/About page image/About bracu.jpg" alt="New Campus" className="w-full h-full object-cover" />
          </div>
        </section>

        {/* 2. Residential Semester (RS) Section */}
        <section className="bg-blue-50 rounded-[40px] p-12 lg:p-20 border border-blue-100">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">The Residential Semester (RS)</h2>
            <p className="text-gray-600 italic font-medium">"A life-changing experience at Savar Campus"</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RSFeature 
              title="Experiential Learning" 
              desc="During the 3rd semester, students live at the Savar campus to develop soft skills and principles through 'Learning by Doing'."
              icon="🌱"
            />
            <RSFeature 
              title="Social Learning Lab" 
              desc="Students take over campus responsibilities—from cooking to gardening—learning that no job is insignificant."
              icon="🧤"
            />
            <RSFeature 
              title="Core Values" 
              desc="Focuses on social responsibility, communication skills in English, and empathy through shared living."
              icon="🏛️"
            />
          </div>
        </section>

        {/* 3. Co-Curricular Activities Section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b-2 border-gray-100 pb-6">
            <div>
              <h2 className="text-4xl font-bold text-blue-900">Co-Curricular Excellence</h2>
              <p className="text-gray-500 mt-2">Flourishing talent beyond the classroom</p>
            </div>
            <div className="mt-4 md:mt-0 text-blue-900 font-black text-6xl opacity-10 uppercase">Clubs & Societies</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubsList.map((club) => (
              <ClubCard key={club.name} {...club} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-700 text-lg mb-8 max-w-3xl mx-auto">
              With over 30 active clubs and societies, BRAC University nurtures future leaders. 
              Participation is encouraged to ensure synchronized development of body, mind, and spirit.
            </p>
            <button className="bg-blue-900 text-white font-bold px-10 py-4 rounded-full hover:bg-yellow-500 hover:text-blue-900 transition-all duration-300">
              Join a Club Today
            </button>
          </div>
        </section>

      </main>

      {/* Footer Quote */}
      <div className="bg-gray-900 text-white py-20 text-center">
        <h3 className="text-3xl font-serif italic mb-4">"Building confidence and self-reliance at every step."</h3>
        <p className="text-gray-500 uppercase tracking-widest text-sm">BRAC University Student Life</p>
      </div>
    </div>
  );
};

const RSFeature = ({ title, desc, icon }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-200">
    <div className="text-5xl mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-blue-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm">{desc}</p>
  </div>
);

/* Updated ClubCard with Circle Image Placeholder */
const ClubCard = ({ name, type, img }) => (
  <div className="group relative bg-white p-6 rounded-3xl border-2 border-gray-100 hover:border-blue-900 hover:shadow-lg transition-all duration-300 overflow-hidden flex items-center space-x-6">
    
    {/* Circle Image / Placeholder container */}
    <div className="relative w-20 h-20 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-100 group-hover:border-yellow-400 transition-colors">
      {img ? (
        <img 
          src={img} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
      ) : (
        /* Placeholder styling: A subtle circle with the first letter */
        <div className="w-full h-full bg-blue-50 text-blue-900 font-black text-3xl flex items-center justify-center">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>

    {/* Text Content */}
    <div className="relative z-10 flex-1">
      <h4 className="text-xl font-bold text-blue-900 group-hover:text-blue-800 transition-colors">{name}</h4>
      <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 group-hover:text-gray-500">{type}</p>
    </div>

  </div>
);

export default StudentLife;