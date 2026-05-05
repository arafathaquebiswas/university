import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (mimetype = '') => {
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📊';
  if (mimetype.includes('image')) return '🖼';
  return '📎';
};

// ── sub-component: material list + upload form for one course ─────────────────
function CourseMaterials({ courseId }) {
  const [materials, setMaterials]   = useState([]);
  const [title, setTitle]           = useState('');
  const [file, setFile]             = useState(null);
  const [uploading, setUploading]   = useState(false);
  const fileRef                     = useRef(null);

  const load = () =>
    api.get(`/materials/course/${courseId}`)
      .then(r => setMaterials(r.data))
      .catch(() => {});

  useEffect(() => { load(); }, [courseId]);

  const [downloadingId, setDownloadingId] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!title.trim()) return toast.error('Please enter a title');

    const fd = new FormData();
    fd.append('courseId', courseId);
    fd.append('title', title.trim());
    fd.append('file', file);

    setUploading(true);
    try {
      await api.post('/materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      setTitle('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId, originalName) => {
    if (!confirm(`Delete "${originalName}"?`)) return;
    try {
      await api.delete(`/materials/${materialId}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const downloadUrl = (materialId) =>
    `${api.defaults.baseURL}/materials/download/${materialId}`;

  const handleDownloadMaterial = async (materialId, originalName) => {
    try {
      setDownloadingId(materialId);
      const response = await api.get(`/materials/download/${materialId}`, {
        responseType: 'blob',
      });

      const downloadName = originalName || 'material';
      const blob = new Blob([response.data], {
        type: response.data.type || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      {/* Upload form */}
      <form onSubmit={handleUpload} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-40">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Material title</label>
          <input
            className="input-field text-sm"
            placeholder="e.g. Lecture 3 – Sorting"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-40">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            File <span className="text-gray-400">(PDF / Word / PPT / Image, max 20 MB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-medium hover:file:bg-blue-100 cursor-pointer"
            onChange={e => setFile(e.target.files[0] || null)}
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="btn-primary text-sm py-2 px-4 whitespace-nowrap disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {/* Material list */}
      {materials.length === 0 ? (
        <p className="text-xs text-gray-400">No materials uploaded yet</p>
      ) : (
        <div className="space-y-1">
          {materials.map(m => (
            <div key={m.materialId}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base flex-shrink-0">{fileIcon(m.mimetype)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.originalName} · {fmtSize(m.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() => handleDownloadMaterial(m.materialId, m.originalName)}
                  disabled={downloadingId === m.materialId}
                  className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:hover:text-gray-400"
                >
                  {downloadingId === m.materialId ? 'Downloading…' : 'Download'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m.materialId, m.originalName)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function FacultyCourses() {
  const [courses, setCourses]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'materials'

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const fid = r.data.facultyProfile?.facultyId;
      if (fid) api.get(`/courses/faculty/${fid}`).then(c => setCourses(c.data));
    });
  }, []);

  const loadStudents = async (courseId) => {
    if (selected === courseId) { setSelected(null); return; }
    setSelected(courseId);
    setActiveTab('students');
    try {
      const { data } = await api.get(`/enrollments/course/${courseId}`);
      setStudents(data);
    } catch { setStudents([]); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => (
          <div
            key={c.courseId}
            onClick={() => loadStudents(c.courseId)}
            className={`card cursor-pointer hover:shadow-md transition-all ${selected === c.courseId ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <span className="badge-blue">{c.courseCode}</span>
              <span className="text-xs text-gray-400">{c.semester}</span>
            </div>
            <h3 className="font-semibold text-gray-800 mt-2">{c.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
            <div className="mt-3 text-xs text-gray-500">{c.credits} credits · Max {c.maxCapacity}</div>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-gray-400 col-span-3">No courses assigned yet</p>
        )}
      </div>

      {/* Detail panel for selected course */}
      {selected && (
        <div className="card">
          {/* Tabs */}
          <div className="flex gap-4 border-b mb-4">
            {[['students', 'Enrolled Students'], ['materials', 'Course Materials']].map(([key, label]) => (
              <button
                key={key}
                onClick={e => { e.stopPropagation(); setActiveTab(key); }}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Students tab */}
          {activeTab === 'students' && (
            students.length === 0 ? (
              <p className="text-sm text-gray-400">No students enrolled</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Student', 'Email', 'Attendance %', 'Status', 'Grade'].map(h => (
                        <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(e => (
                      <tr key={e.enrollId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{e.student?.user?.username}</td>
                        <td className="px-4 py-2 text-gray-500">{e.student?.user?.email}</td>
                        <td className="px-4 py-2">
                          <span className={`font-medium ${parseFloat(e.attendancePercentage) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {e.attendancePercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={e.status === 'active' ? 'badge-green' : 'badge-gray'}>{e.status}</span>
                        </td>
                        <td className="px-4 py-2">
                          {e.grade ? `${e.grade.letterGrade} (${e.grade.totalMarks?.toFixed(1)})` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Materials tab */}
          {activeTab === 'materials' && (
            <CourseMaterials courseId={selected} />
          )}
        </div>
      )}
    </div>
  );
}
