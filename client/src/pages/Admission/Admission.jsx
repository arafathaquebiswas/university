import React, { useState } from 'react';
import Navbar from '../../components/Navbar';

const Admissions = () => {
  const [activeTab, setActiveTab] = useState('requirements');

  const sscHscRequirements = [
    { label: "SSC/Equivalent and HSC/Equivalent (including additional subject)", value: "GPA 3.5 in SSC and HSC separately" },
    { label: "O-Level with five subjects and A-Level with two subjects (A=5, B=4, C=3, D=2)", value: "GPA 2.5 in O-Level and A-Level separately" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold uppercase tracking-wider">Admission Procedures</h1>
          <p className="mt-4 text-blue-100 max-w-3xl leading-relaxed">
            BRAC University always pays close attention to convenient approach in terms of Admission Procedures. 
            The application process is online and applicants can apply from the convenience of their home.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2">
            <section className="prose prose-blue max-w-none text-gray-700">
              <p>
                The entire process of admission goes through an intensely selective method where applicants are asked 
                to follow each phase precisely within the given framework of instructions. To get admitted into 
                BRAC University, applicants must qualify in the admission test (written and an interview) after 
                submitting their online application form.
              </p>
              <p className="font-semibold text-blue-900">
                As the admission test is a highly competitive one, applicants are required to perform 
                satisfactorily in the examination in order to secure their seats.
              </p>
            </section>

            <div className="mt-12">
              <h2 className="text-3xl font-bold text-blue-900 border-b-4 border-yellow-500 inline-block mb-8">
                Undergraduate Admission
              </h2>

              {/* Tabs for Apply / Requirements */}
              <div className="flex space-x-4 mb-6">
                <button 
                  onClick={() => setActiveTab('requirements')}
                  className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'requirements' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Admission Requirements
                </button>
                <button 
                  onClick={() => setActiveTab('apply')}
                  className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'apply' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Apply Now
                </button>
              </div>

              {activeTab === 'requirements' ? (
                <div className="space-y-10 animate-fadeIn">
                  <RequirementTable 
                    title="Minimum Qualifications (General & CSE)" 
                    data={sscHscRequirements}
                    specifics={[
                      { prog: "HSC/Equivalent", grade: '"B" grade in Physics & Higher Mathematics' },
                      { prog: "A-Levels", grade: '"C" grade in Physics & Mathematics' }
                    ]}
                    note='Candidates who have qualified in HSC/A-levels or equivalent in 2023 or later are eligible to apply. "E" grades will not be considered.'
                  />
                  
                  <RequirementTable 
                    title="B.Sc. in Electrical and Electronic Engineering (EEE)" 
                    data={sscHscRequirements}
                    specifics={[
                      { prog: "HSC/Equivalent", grade: '"B" grade in Physics & Higher Mathematics' },
                      { prog: "A-Levels", grade: '"C" grade in Physics & Mathematics' }
                    ]}
                    note='Candidates for BSc in ECE and EEE who had Physics and Mathematics but not Chemistry in HSC/A-level will take a remedial course on Chemistry. Candidates qualified in 2023 or later are eligible. "E" grades will not be considered.'
                  />
                </div>
              ) : (
                <div className="bg-blue-50 p-8 rounded-xl border border-blue-100 animate-fadeIn">
                  <h3 className="text-2xl font-bold text-blue-900 mb-6">Application Instructions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-gray-800 uppercase text-sm tracking-widest mb-2">Contact Info</h4>
                      <p className="text-gray-700">Mobile: +880 1234 567890</p>
                      <p className="text-gray-700">Email: admissions@bracu.ac.bd</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 uppercase text-sm tracking-widest mb-2">Test Schedule</h4>
                      <p className="text-gray-700 font-semibold">Date: June 15, 2026</p>
                      <p className="text-gray-700">Location: BRAC University New Campus, Merul Badda</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-blue-200">
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-3 px-8 rounded-lg shadow-md transition">
                      Proceed to Payment (Placeholder)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-gray-900 text-white p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Important Dates</h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span>Application Starts</span>
                    <span className="text-yellow-500">20th April, 2026</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span>Deadline</span>
                    <span className="text-yellow-500">30th May, 2026</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const RequirementTable = ({ title, data, specifics, note }) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
      <h3 className="font-bold text-blue-900">{title}</h3>
    </div>
    <table className="w-full text-left text-sm border-collapse">
      <thead>
        <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
          <th className="px-6 py-3 border-b">Particulars</th>
          <th className="px-6 py-3 border-b text-right">Minimum GPA/Grade</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50 transition">
            <td className="px-6 py-4 text-gray-700">{item.label}</td>
            <td className="px-6 py-4 text-right font-semibold text-blue-900">{item.value}</td>
          </tr>
        ))}
        {specifics.map((item, index) => (
          <tr key={index} className="bg-blue-50/30">
            <td className="px-6 py-4 text-gray-700 italic">{item.prog} (Specific)</td>
            <td className="px-6 py-4 text-right font-medium text-blue-800">{item.grade}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="bg-yellow-50 px-6 py-4 text-xs text-yellow-900 leading-relaxed italic border-t border-yellow-100">
      <strong>Note:</strong> {note}
    </div>
  </div>
);

export default Admissions;