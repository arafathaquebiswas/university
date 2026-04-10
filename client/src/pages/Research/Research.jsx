import React from 'react';
import Navbar from '../../components/Navbar';

const Research = () => {
  const achievements = [
    {
      title: "UGC Ranking",
      desc: "Leading university in research investment according to University Grants Commission’s annual report 2019.",
      icon: "📊"
    },
    {
      title: "Yidan Prize",
      desc: "The BRAC Institute of Educational Development won the famous Yidan Prize for its multiple achievements.",
      icon: "🏆"
    },
    {
      title: "Global Health Leader",
      desc: "The James P Grant School of Public Health recognized by Johns Hopkins University as a top School in the region.",
      icon: "🏥"
    },
    {
      title: "Top 40 Think Tank",
      desc: "The BRAC Institute of Governance and Development recognized as a top 40 think tank worldwide.",
      icon: "🏛️"
    },
    {
      title: "Peace & Justice",
      desc: "International respect for the Centre for Peace and Justice in promoting global social justice and advocacy.",
      icon: "⚖️"
    },
    {
      title: "UK Partnership",
      desc: "Partnership with the University of Birmingham, UK for Covid vaccine distribution strategy in Bangladesh.",
      icon: "🤝"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header Section */}
      <div className="bg-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold tracking-tight">Research at BRAC University</h1>
          <p className="mt-4 text-blue-200 text-xl max-w-3xl font-light">
            Impact through relevant research is a core initiative area. We intend to make BRAC University 
            a proud global institution from Bangladesh.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
            <p>
              Several of the schools and institutes of the University are highly respected internationally 
              for their contribution to research and knowledge exchange. We are currently developing 
              new specialisms such as <span className="text-blue-900 font-bold underline decoration-yellow-500">Robotics</span>.
            </p>
            <p>
              The University is active in many vital areas, including humanitarian work, Rohingya programs, 
              public health, climate development, architectural innovation, and business development in the 
              garment industry.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img 
              src="Public/Research/research.jpg" 
              alt="Research at BRAC University" 
              className="relative rounded-2xl shadow-2xl object-cover w-full h-[400px]"
            />
          </div>
        </div>

        {/* At a Glance Section */}
        <section className="bg-gray-50 rounded-3xl p-10 md:p-16 border border-gray-100 shadow-inner">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">At a Glance</h2>
            <div className="h-1.5 w-24 bg-yellow-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer-like call to action */}
      <div className="bg-blue-900 py-12 text-center text-white">
        <p className="text-lg italic opacity-80">
          "Contributing to global knowledge exchange and domestic innovation."
        </p>
      </div>
    </div>
  );
};

export default Research;