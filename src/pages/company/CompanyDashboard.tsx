import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import appApi from '../../config/axios';
import { Home, Bell, Edit, Settings, Search, ChevronRight, Link as LinkIcon, Check } from 'lucide-react';
import { getRequestedEmployees, acceptEmployee, getApprovedEmployees, RequestedEmployee, Employee } from '../../API/company.api';
import { errorPopup, successPopup } from '../../utils/popup';

interface Company {
  _id: string;
  name?: string;
  email?: string;
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);

  const [query, setQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requestedEmployees, setRequestedEmployees] = useState<RequestedEmployee[]>([]);
  const [page, setPage] = useState(1);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [approvingEmail, setApprovingEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanyId() {
      try {
        const response = await appApi.get<Company>('/company/company');
        setCompany(response.data);
      } catch (error) {
        console.error('Error fetching company id:', error);
      }
    }

    fetchCompanyId();
  }, []);

  useEffect(() => {
    async function fetchRequestedEmployees() {
      if (!company?._id) return;
      
      setIsLoadingRequests(true);
      try {
        const employees = await getRequestedEmployees();
        setRequestedEmployees(employees);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to fetch requested employees";
        errorPopup(errorMessage);
      } finally {
        setIsLoadingRequests(false);
      }
    }

    fetchRequestedEmployees();
  }, [company?._id]);

  useEffect(() => {
    async function fetchApprovedEmployees() {
      if (!company?._id) return;
      
      setIsLoadingEmployees(true);
      try {
        const approvedEmployees = await getApprovedEmployees();
        setEmployees(approvedEmployees);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to fetch employees";
        errorPopup(errorMessage);
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    fetchApprovedEmployees();
  }, [company?._id]);

  const handleApproveEmployee = async (email: string) => {
    setApprovingEmail(email);
    try {
      await acceptEmployee(email);
      successPopup("Employee approved successfully!");
      // Remove the approved employee from the requested list
      setRequestedEmployees(prev => prev.filter(emp => emp.email !== email));
      // Refresh the approved employees list
      const approvedEmployees = await getApprovedEmployees();
      setEmployees(approvedEmployees);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to approve employee";
      errorPopup(errorMessage);
    } finally {
      setApprovingEmail(null);
    }
  };

  const employeeLoginLink = `${window.location.origin}/employee/login?companyid=${company?._id ?? ''}`;

  // Navigate to employee login page
  const handleEmployeeLoginClick = () => {
    if (company?._id) {
      navigate(`/employee/login?companyid=${company._id}`);
    }
  };

  // copy-to-clipboard with fallback
  async function handleCopy() {
    const text = employeeLoginLink;
    if (!text) return;

    // try native clipboard API
    try {
      if (navigator && 'clipboard' in navigator) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback to textarea method
        const ta = document.createElement('textarea');
        ta.value = text;
        // prevent scrolling to bottom
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      setCopied(true);
      // clear after 2s
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = employees.filter((e) =>
      !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q)
    );
    // Sort by creation date (newest first) or reverse
    list = list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortNewest ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [query, employees, sortNewest]);

  function toggleActive(id: string) {
    setEmployees((prev) => prev.map((p) => (p._id === id ? { ...p, active: !p.active } : p)));
  }

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Use approved employees for the sidebar members list
  const filteredMembers = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    return employees
      .filter((e) => !q || e.name?.toLowerCase().includes(q))
      .map((e, index) => ({
        id: index + 1,
        name: e.name || 'Unknown',
        status: e.active ? 'online' as const : 'offline' as const
      }));
  }, [sidebarSearch, employees]);

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden p-4">
      {/* Left Icon Sidebar */}
      <aside className="w-14 h-100 mt-37 flex flex-col items-center gap-4 p-3 bg-white rounded-xl shadow-md mr-3">
        {/* Logo */}
        <div 
          className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleEmployeeLoginClick}
          title="Open employee login"
        >
          <span className="text-xs truncate">logo</span>
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
            company details
          </div>
        </div>
      </aside>

      {/* Members Sidebar */}
      <aside className="w-80 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden mr-4">
        <div className="pl-6 pr-6 pt-6 pb-3">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Company name</h2>
          <p className="text-sm text-gray-500">Manage your team</p>
        </div>

        {/* Invite Card */}
        <div className="pl-6 pr-6 pb-6">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-xl">
            <p className="text-sm text-center leading-relaxed mb-4 opacity-95">
              Experience remote work
              <br />
              Make it feel less remote
            </p>

            <div className="flex items-center gap-3">
              {/* show short link + copy button */}
              <button onClick={handleCopy}
                title="Copy invite link">

              <div className="flex-1 text-xs truncate bg-white/10 px-14 py-2 rounded-lg flex items-center gap-2">
                <LinkIcon className="h-4 w-4 opacity-90" />
                <span className="truncate">{copied ? 'Copied!' : 'Copy Invite Link'}</span>
              </div>
              </button>
            </div>
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
            {/* <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Online ({filteredMembers.filter((m) => m.status === 'online').length})
              </h3>
              <ChevronRight className="h-4 w-4 text-indigo-500" />
            </div> */}

            {/* <ul className="space-y-2">
              {filteredMembers.filter((m) => m.status === 'online').map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-semibold text-white">
                      {m.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
                    <div className="text-xs text-green-600">Active now</div>
                  </div>
                </li>
              ))}
            </ul> */}
          </div>

          <div>
            {/* <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Offline ({filteredMembers.filter((m) => m.status === 'offline').length})
              </h3>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div> */}

            {/* <ul className="space-y-2">
              {filteredMembers.filter((m) => m.status === 'offline').map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {m.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{m.name}</div>
                    <div className="text-xs text-gray-400">Away</div>
                  </div>
                </li>
              ))}
            </ul> */}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Requested Employees Section */}
          {isLoadingRequests ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm mb-6 p-6">
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-3 text-gray-600">Loading employee requests...</span>
              </div>
            </div>
          ) : requestedEmployees.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm mb-6 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Employee Requests</h2>
                  {/* <p className="text-sm text-gray-600 mt-1">
                    {requestedEmployees.length} {requestedEmployees.length === 1 ? 'employee' : 'employees'} waiting for approval
                  </p> */}
                </div>
              </div>
              <div className="space-y-3">
                {requestedEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    className="bg-white rounded-xl p-4 border border-yellow-200 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex flex-1 items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm font-semibold text-white">
    {emp.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'E'}
  </div>

  <div className="flex flex-col">
    <div className="font-semibold text-gray-800">{emp.name || 'Unknown'}</div>
    <div className="text-sm text-gray-600">{emp.email}</div>
  </div>
</div>

                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveEmployee(emp.email)}
                        disabled={approvingEmail === emp.email}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          approvingEmail === emp.email
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        {approvingEmail === emp.email ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">All Employees</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {employees.filter((e) => e.active).length} Active Members
                </span>
              </div>
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
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Address
                    </th>
                    {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoadingEmployees ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="ml-3 text-gray-600">Loading employees...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="text-gray-400">
                          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium">No employees found</p>
                          <p className="text-xs mt-1">Try adjusting your search</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((emp) => (
                      <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                              {emp.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'E'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{emp.name || 'Unknown'}</div>
                            
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{emp.position || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            {emp.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{emp.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{emp.address || 'N/A'}</span>
                        </td>
                        {/* <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(emp._id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              emp.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {emp.active ? '✓ Active' : '✕ Inactive'}
                          </button>
                        </td> */}
                      </tr>
                    ))
                  )}

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
              <span className="font-semibold">{Math.min(page * pageSize, filtered.length)}</span> of <span className="font-semibold">{filtered.length}</span>{' '}
              entries
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
                      page === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
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
