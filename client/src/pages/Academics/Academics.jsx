import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

// ── Department accordion card ─────────────────────────────────────────────────
const DepartmentCard = ({ dept }) => {
  const [isOpen, setIsOpen] = useState(false);
  const programs = dept.programs || [];

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 focus:outline-none text-left"
      >
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-blue-900">{dept.name}</h3>
          {dept.head && (
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-semibold text-gray-600">Head:</span> {dept.head}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
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

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 md:px-8 md:pb-8 border-t border-gray-100 bg-gray-50/40">
          {programs.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {programs.map(prog => (
                <div
                  key={prog.progId}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h4 className="font-bold text-blue-900 text-sm leading-snug">{prog.name}</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                      {prog.duration} {prog.duration === 1 ? 'Year' : 'Years'}
                    </span>
                    <span className="text-xs text-gray-400">Full-Time Degree</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-400 italic text-center py-4">
              No programs listed under this department yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Academics = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    setError(null);
    api.get('/public/departments')
      .then(r => setDepartments(Array.isArray(r.data) ? r.data : []))
      .catch(err => {
        console.error('Academics fetch error:', err);
        setError('Could not load departments. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-blue-900 text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Academics</h1>
          <p className="mt-4 text-blue-100 text-lg md:text-xl max-w-2xl font-light">
            Discover our specialized departments and the diverse academic programs designed to shape future leaders.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto py-10 md:py-14 px-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin" />
            <p className="text-blue-900 font-semibold">Loading Academic Structure…</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center bg-red-50 border border-red-200 rounded-xl p-10">
            <p className="text-red-600 font-medium text-lg">⚠ {error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); api.get('/public/departments').then(r => setDepartments(r.data)).catch(() => setError('Still unreachable.')).finally(() => setLoading(false)); }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && departments.length === 0 && (
          <div className="text-center bg-white border border-dashed border-gray-300 rounded-xl p-12">
            <p className="text-gray-500 text-lg font-medium">No departments found.</p>
            <p className="text-gray-400 text-sm mt-2">Academic structure will appear here once configured by the admin.</p>
          </div>
        )}

        {!loading && !error && departments.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-6">
              {departments.length} department{departments.length !== 1 ? 's' : ''} ·{' '}
              {departments.reduce((s, d) => s + (d.programs?.length || 0), 0)} programs
            </p>
            {departments.map(dept => (
              <DepartmentCard key={dept.deptId} dept={dept} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Academics;
