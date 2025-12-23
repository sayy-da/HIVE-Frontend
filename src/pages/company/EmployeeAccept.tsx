import { useState, useMemo } from 'react';
import { Home, Bell, Edit, Settings, Search, ChevronRight } from 'lucide-react';

type Employee = {
  id: string;
  name: string;
  position: string;
  role: 'Admin' | 'User' | 'Manager';
  email: string;
  attendance: number;
  active: boolean;
};

type Member = {
  id: number;
  name: string;
  status: 'online' | 'offline';
};

const sampleEmployees: Employee[] = [
  { id: '1', name: 'Jane Cooper', position: 'CEO', role: 'Admin', email: 'jane@microsoft.com', attendance: 12, active: true },
  { id: '2', name: 'Floyd Miles', position: 'Developer', role: 'User', email: 'floyd@yahoo.com', attendance: 3, active: false },
  { id: '3', name: 'Ronald Richards', position: 'Manager', role: 'User', email: 'ronald@adobe.com', attendance: 8, active: false },
  { id: '4', name: 'Aneesh Menon', position: 'Designer', role: 'User', email: 'aneesh@company.com', attendance: 10, active: true },
  { id: '5', name: 'Sayyida', position: 'Developer', role: 'User', email: 'sayyida@company.com', attendance: 7, active: true },
];

const members: Member[] = [
  { id: 1, name: 'Aneesh Menon', status: 'online' },
  { id: 2, name: 'Sayyida', status: 'offline' },
  { id: 3, name: 'Jane Cooper', status: 'online' },
  { id: 4, name: 'Floyd Miles', status: 'offline' },
];

export default function EmployeeAccept() {
  const [query, setQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);
  const [page, setPage] = useState(1);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = employees.filter((e) =>
      !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.position.toLowerCase().includes(q)
    );
    list = list.sort((a, b) => (sortNewest ? b.attendance - a.attendance : a.attendance - b.attendance));
    return list;
  }, [query, employees, sortNewest]);

  function toggleActive(id: string) {
    setEmployees((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const filteredMembers = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    return members.filter(m => !q || m.name.toLowerCase().includes(q));
  }, [sidebarSearch]);

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden p-4">
      {/* Left Icon Sidebar */}
    <aside className="w-14 h-100 mt-37 flex flex-col items-center gap-4 p-3 bg-white rounded-xl shadow-md mr-3">
  {/* Logo */}
  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow">
    C
  </div>

  {/* Navigation */}
  <nav className="flex flex-col items-center gap-3 mt-2 flex-1 justify-center">
    <button title="home" className="p-2.5 rounded-lg hover:bg-indigo-50 transition-colors group">
      <Home className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
    </button>

    <button title="notifications" className="p-2.5 rounded-lg hover:bg-indigo-50 transition-colors group relative">
      <Bell className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
    </button>

    <button title="edit" className="p-2.5 rounded-lg hover:bg-indigo-50 transition-colors group">
      <Edit className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
    </button>

    <button title="settings" className="p-2.5 rounded-lg hover:bg-indigo-50 transition-colors group">
      <Settings className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
    </button>
  </nav>

  {/* Avatar */}
  <div className="w-9 h-9 rounded-full overflow-hidden border border-indigo-200 shadow-sm">
    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-xs font-semibold text-white">
      S
    </div>
  </div>
</aside>


      {/* Members Sidebar */}
      <aside className="w-80 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden mr-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Company Portal</h2>
          <p className="text-sm text-gray-500">Manage your team</p>
        </div>

        {/* Invite Card */}
        <div className="p-6 ">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-xl">
            <p className="text-sm text-center leading-relaxed mb-4 opacity-95">
              Experience remote work<br />
              Make it feel less remote
            </p>

            <div className="flex justify-center mb-4">
              <div className="flex -space-x-2">
                {['A', 'B', 'C', 'D', 'E'].map((x, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-xs font-semibold border-2 border-white/30"
                  >
                    {x}
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg hover:shadow-xl transition-shadow">
              📋 Copy Invite Link
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
              placeholder="Search members..."
            />
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Online ({filteredMembers.filter(m => m.status === 'online').length})
              </h3>
              <ChevronRight className="h-4 w-4 text-indigo-500" />
            </div>

            <ul className="space-y-2">
              {filteredMembers.filter(m => m.status === 'online').map(m => (
                <li key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-semibold text-white">
                      {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
                    <div className="text-xs text-green-600">Active now</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Offline ({filteredMembers.filter(m => m.status === 'offline').length})
              </h3>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>

            <ul className="space-y-2">
              {filteredMembers.filter(m => m.status === 'offline').map(m => (
                <li key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{m.name}</div>
                    <div className="text-xs text-gray-400">Away</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Requested Employees</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
                <label className="text-xs text-gray-500 font-medium">Sort by:</label>
                <select
                  value={sortNewest ? 'newest' : 'oldest'}
                  onChange={(e) => setSortNewest(e.target.value === 'newest')}
                  className="bg-transparent outline-none text-gray-700 font-medium"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Employee Name
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Position
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {pageItems.map((emp) => (
          <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
            {/* Name */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                  {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{emp.name}</div>
                </div>
              </div>
            </td>

            {/* Email */}
            <td className="px-6 py-4 text-sm text-gray-600">
              {emp.email}
            </td>

            {/* Position */}
            <td className="px-6 py-4 text-sm text-gray-600">
              {emp.position}
            </td>


            {/* Accept / Reject Buttons */}
            <td className="px-6 py-4 flex gap-3">
              <button
                onClick={() => toggleActive(emp.id)}
                className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
              >
                Accept
              </button>

              <button
                onClick={() =>
                  setEmployees((prev) =>
                    prev.filter((p) => p.id !== emp.id)
                  )
                }
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Reject
              </button>
            </td>
          </tr>
        ))}

        {pageItems.length === 0 && (
          <tr>
            <td colSpan={6} className="px-6 py-16 text-center">
              <div className="text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No employees found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>


          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{Math.min((page - 1) * pageSize + 1, filtered.length)}</span> to{' '}
              <span className="font-semibold">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
              <span className="font-semibold">{filtered.length}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(pageCount, page + 1))}
                disabled={page === pageCount}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}