import Navbar from '../../components/Navbar';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">About BRAC University</h1>
          <p className="mt-2 text-blue-200">Excellence in Higher Education since 2001</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
            <p>
              <span className="font-bold text-blue-900">BRAC University</span>, established in 2001, is located in Dhaka, Bangladesh. 
              BRAC University follows a liberal arts approach to education which nurtures fresh ideas and gives new impetus to 
              the field of tertiary education.
            </p>
            <p>
              It ensures a high quality of education and aims to meet the demands of contemporary times. 
              Building on BRAC's experience of seeking solutions to challenges posed by extreme poverty, 
              BRAC University hopes to instill in its students a commitment to working towards national 
              development and progress.
            </p>
            <p>
              The medium of instruction and examination at BRAC University is English. 
              BRAC University is accredited by the University Grants Commission (UGC) and approved by 
              the Ministry of Education, Government of Bangladesh.
            </p>
          </div>

          {/* Image Content */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-50">
            {/* You can replace this URL with a local image from your 'Campus images' folder */}
            <img 
              src="Public/About page image/About bracu.jpg" 
              alt="BRAC University Campus" 
              className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
            />
          </div>
        </div>
      </div>

      {/* Footer-like simple banner */}
      <div className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 BRAC University Portal - All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default About;