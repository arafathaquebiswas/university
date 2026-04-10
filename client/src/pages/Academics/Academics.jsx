import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';

const Academics = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Ensure this port matches your server.js (5001)
        const response = await axios.get('http://localhost:5001/api/admin/departments');
        console.log("Full Response Object:", response); // Look at this in F12 Console
        setDepartments(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="bg-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold tracking-tight">Academics</h1>
          <p className="mt-4 text-blue-100 text-xl max-w-2xl font-light">
            Discover our specialized departments and the diverse academic programs designed to shape future leaders.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-12 px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-blue-900 font-bold text-xl">Loading Academic Structure...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {departments.length > 0 ? (
              departments.map((dept) => (
                <DepartmentAccordion key={dept.deptId} dept={dept} />
              ))
            ) : (
              <div className="text-center bg-white p-10 rounded-xl shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No departments found in the system.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const DepartmentAccordion = ({ dept }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Matches your 'as: programs' alias from models/index.js
  const programs = dept.programs || [];

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-8 focus:outline-none"
      >
        <div className="text-left">
          <h3 className="text-2xl font-bold text-blue-900">{dept.name}</h3>
          <div className="flex items-center mt-2 text-gray-500">
            <span className="text-sm">
              <span className="font-semibold text-gray-700">Department Head:</span> {dept.head || 'To be assigned'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Programs</p>
            <p className="text-2xl font-black text-blue-900">{programs.length}</p>
          </div>
          <svg 
            className={`w-6 h-6 text-blue-900 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Accordion Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-8 pt-0 border-t border-gray-50 bg-gray-50/50">
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.length > 0 ? (
              programs.map((prog) => (
                <div key={prog.progId} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-blue-900">{prog.name}</h4>
                  <div className="mt-3 flex items-center text-xs text-gray-500 font-medium">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-2">
                      {prog.duration} Years
                    </span>
                    <span>Full-Time Degree</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center py-4 text-gray-400 italic">
                No programs are currently listed under this department.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academics;