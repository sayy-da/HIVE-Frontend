import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import appApi from '../../config/axios';
import { Home, Bell, Edit, Settings, Search, Check, X, Plus, LogOut } from 'lucide-react';
import { 
  getRequestedEmployees, 
  acceptEmployee, 
  getAllEmployees, 
  RequestedEmployee, 
  Employee, 
  createEmployeeProfile, 
  toggleEmployeeStatus, 
  Company, 
  updateEmployee, 
} from '../../API/company.api';
import { logoutCompany } from '../../API/company.api';
import { logout } from '../../features/company/companySlice';
import { AppDispatch, RootState } from '../../store';
import { errorPopup, successPopup } from '../../utils/popup';
import { SuccessMessage, ErrorMessage, ValidationMessage } from '../../constants/messages';

export default function CompanyDashboard() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const companyState = useSelector((state: RootState) => state.company);
  const { accessToken } = companyState;
  
  // Console log to check access token in Redux
  console.log("Company Dashboard - Access Token in Redux:", accessToken);
  console.log("Company Dashboard - Full Company State:", companyState);
  
  const [company, setCompany] = useState<Company | null>(null);
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requestedEmployees, setRequestedEmployees] = useState<RequestedEmployee[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [approvingEmail, setApprovingEmail] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingEmployeeId, setTogglingEmployeeId] = useState<string | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState<{
    show: boolean;
    employeeId: string;
    employeeName: string;
    targetStatus: 'active' | 'inactive';
  }>({
    show: false,
    employeeId: '',
    employeeName: '',
    targetStatus: 'inactive',
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    role: 'user' as 'admin' | 'user'
  });
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    position: '',
    role: 'user' as 'admin' | 'user'
  });

  // Use refs to prevent multiple fetches
  const hasFetchedCompany = useRef(false);
  const hasFetchedRequests = useRef(false);
  const hasFetchedEmployees = useRef(false);

  // Fetch company data - ONCE
  useEffect(() => {
    async function fetchCompanyId() {
      if (!accessToken || hasFetchedCompany.current) return;
      
      hasFetchedCompany.current = true;
      
      try {
        const response = await appApi.get('/company/company');
        setCompany(response.data);
      } catch (error: any) {
        hasFetchedCompany.current = false; // Reset on error
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          dispatch(logout());
          navigate('/company/login', { replace: true });
        } else {
          console.error('Error fetching company id:', error);
        }
      }
    }
    
    fetchCompanyId();
  }, [accessToken]); // Only depend on accessToken

  // Fetch requested employees - ONCE when company is loaded
  useEffect(() => {
    async function fetchRequestedEmployees() {
      if (!company?._id || hasFetchedRequests.current) return;
      
      hasFetchedRequests.current = true;
      setIsLoadingRequests(true);
      
      try {
        const employees = await getRequestedEmployees();
        setRequestedEmployees(employees);
      } catch (error: any) {
        hasFetchedRequests.current = false; // Reset on error
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            ErrorMessage.FailedToFetchRequestedEmployees;
        errorPopup(errorMessage);
      } finally {
        setIsLoadingRequests(false);
      }
    }
    
    fetchRequestedEmployees();
  }, [company?._id]); // Only depend on company ID, not the entire object

  // Fetch all employees - ONCE when company is loaded
  useEffect(() => {
    async function fetchAllEmployees() {
      if (!company?._id || hasFetchedEmployees.current) return;
      
      hasFetchedEmployees.current = true;
      setIsLoadingEmployees(true);
      
      try {
        const allEmployees = await getAllEmployees();
        console.log(allEmployees)

        setEmployees(allEmployees);
      } catch (error: any) {
        hasFetchedEmployees.current = false; // Reset on error
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            ErrorMessage.FailedToFetchEmployees;
        errorPopup(errorMessage);
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    
    fetchAllEmployees();
  }, [company?._id]); // Only depend on company ID, not the entire object 
 const handleApproveEmployee = async (email: string) => {
    setApprovingEmail(email);
    try {
      await acceptEmployee(email);
      successPopup(SuccessMessage.EmployeeApproved);
      setRequestedEmployees(prev => prev.filter(emp => emp.email !== email));
      const allEmployees = await getAllEmployees();
      setEmployees(allEmployees);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          ErrorMessage.FailedToApproveEmployee;
      errorPopup(errorMessage);
    } finally {
      setApprovingEmail(null);
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: 'active' | 'inactive' | 'pending') => {
    // Show confirmation modal before changing between active and inactive
    if (currentStatus === 'active' || currentStatus === 'inactive') {
      const employee = employees.find(emp => emp._id === employeeId);
      setShowBlockConfirm({ 
        show: true, 
        employeeId, 
        employeeName: employee?.name || 'this employee',
        targetStatus: currentStatus === 'active' ? 'inactive' : 'active',
      });
      return;
    }

    // For pending (or any other), proceed directly
    await performToggleStatus(employeeId);
  };

  const performToggleStatus = async (employeeId: string) => {
    setTogglingEmployeeId(employeeId);
    try {
      const updatedEmployee = await toggleEmployeeStatus(employeeId);
      const isActive = updatedEmployee.status === "active";
      successPopup(isActive ? SuccessMessage.EmployeeActivated : SuccessMessage.EmployeeDeactivated);
      const allEmployees = await getAllEmployees();
      setEmployees(allEmployees);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || ErrorMessage.FailedToUpdateEmployeeStatus;
        errorPopup(errorMessage);
    } finally {
      setTogglingEmployeeId(null);
      setShowBlockConfirm({
        show: false,
        employeeId: '',
        employeeName: '',
        targetStatus: 'inactive',
      });
    }
  };

  const handleConfirmBlock = () => {
    performToggleStatus(showBlockConfirm.employeeId);
  };

  const handleCancelBlock = () => {
    setShowBlockConfirm({
      show: false,
      employeeId: '',
      employeeName: '',
      targetStatus: 'inactive',
    });
  };

  const handleLogout = async () => {
    try {
      await logoutCompany();
      dispatch(logout());
      successPopup(SuccessMessage.LoggedOutSuccessfully);
      navigate("/company/login", { replace: true });
    } catch (error: any) {
      dispatch(logout());
      navigate("/company/login", { replace: true });
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?._id) {
      errorPopup(ValidationMessage.CompanyIdNotFound);
      return;
    }

    if (!newEmployee.name || !newEmployee.email || !newEmployee.position || !newEmployee.role) {
      errorPopup(ValidationMessage.AllFieldsRequired);
      return;
    }

    setIsCreating(true);
    try {
      await createEmployeeProfile(newEmployee, company._id);
      successPopup(SuccessMessage.EmployeeProfileCreated);
      setIsCreateModalOpen(false);
      setNewEmployee({ name: '', email: '', position: '', role: 'user' });

      const allEmployees = await getAllEmployees();
      setEmployees(allEmployees);
    } catch (error: any) {
    } finally {
      setIsCreating(false);
    }
  };



  const handleOpenEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      name: employee.name || '',
      position: employee.position || '',
      role: employee.role || 'user'
    });
    setIsEditEmployeeModalOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee?._id) {
      errorPopup('Employee ID not found');
      return;
    }

    if (!employeeFormData.name || !employeeFormData.position) {
      errorPopup(ValidationMessage.AllFieldsRequired);
      return;
    }

    setIsUpdatingEmployee(true);
    try {
      const updatedEmployee = await updateEmployee(editingEmployee._id, employeeFormData);
      if (!updatedEmployee || !updatedEmployee._id) {
        throw new Error('Invalid employee data received');
      }
      setEmployees(employees.map(emp => emp._id === updatedEmployee._id ? updatedEmployee : emp));
      successPopup('Employee updated successfully!');
      setIsEditEmployeeModalOpen(false);
      setEditingEmployee(null);
    } catch (error: any) {
      // axiosPatchRequest already shows error popup, so only show if it's a different error
      if (!error.response) {
        const errorMessage = error.message || 'Failed to update employee';
        errorPopup(errorMessage);
      }
      // If error.response exists, axiosPatchRequest already handled the popup
    } finally {
      setIsUpdatingEmployee(false);
    }
  };




  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = employees.filter((e) => {
      const matchesSearch = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q);
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'pending' && e.status === 'pending') ||
        (statusFilter === 'active' && e.status === 'active') ||
        (statusFilter === 'inactive' && e.status === 'inactive');
      return matchesSearch && matchesStatus;
    });
   
    list = list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Sort by newest first
    });
    return list;
  }, [query, employees, statusFilter]);

  
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Show loading state while checking authentication
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden p-4">
      {/* Left Icon Sidebar */}
      <aside className="w-14 h-100 mt-37 flex flex-col items-center gap-4 p-3 bg-white rounded-xl shadow-md mr-3">
    
        

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

          <button 
            onClick={() => navigate('/company/profile')}
            className="p-2.5 rounded-lg hover:bg-indigo-50 transition-colors group relative"
          >
            <Settings className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-gray-900">
              Profile
            </span>
          </button>
        </nav>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          title="Logout" 
          className="p-2.5 rounded-lg hover:bg-red-50 transition-colors group mb-3"
        >
          <LogOut className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
        </button>

        
      </aside>

      {/* Members Sidebar */}
      <aside className="w-80 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden mr-4">
        <div className="pl-6 pr-6 pt-6 pb-3">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {company?.name || 'Loading...'}
          </h2>
          <p className="text-sm text-gray-500">
            {company?.email ? `${company.email}` : 'Manage your team'}
          </p>
          {company?.address && (
            <p className="text-xs text-gray-400 mt-1">{company.address}</p>
          )}
        </div>

      
        {/* <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
              placeholder="Search members..."
            />
          </div>
        </div> */}
       
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
    {emp.characterTexture}
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
          

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Add Employee</span>
              </button>
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
                <label className="text-xs text-gray-500 font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'all' | 'pending' | 'active' | 'inactive');
                    setPage(1);
                  }}
                  className="bg-transparent outline-none text-gray-700 font-medium"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
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
                              {emp.characterTexture}
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
                          {emp.status === 'active' || emp.status === 'inactive' ? (
                            <button
                              onClick={() => handleToggleEmployeeStatus(emp._id, emp.status)}
                              disabled={togglingEmployeeId === emp._id}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                                emp.status === 'active'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              } ${togglingEmployeeId === emp._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {togglingEmployeeId === emp._id ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Updating...
                                </>
                              ) : emp.status === 'active' ? (
                                '✓ Active'
                              ) : (
                                '✕ Inactive'
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenEditEmployee(emp)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit employee"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
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

      {/* Create Employee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Employee Profile</h2>
              
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewEmployee({ name: '', email: '', position: '', role: 'user' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isCreating}
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter employee name"
                  required
                  disabled={isCreating}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter employee email"
                  required
                  disabled={isCreating}
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter employee position"
                  required
                  disabled={isCreating}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as "admin" | "user" })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  required
                  disabled={isCreating}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewEmployee({ name: '', email: '', position: '', role: 'user' });
                  }}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Edit Employee Modal */}
      {isEditEmployeeModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Edit Employee</h2>
              <button
                onClick={() => {
                  setIsEditEmployeeModalOpen(false);
                  setEditingEmployee(null);
                  setEmployeeFormData({ name: '', position: '', role: 'user' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdatingEmployee}
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-employee-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="edit-employee-name"
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter employee name"
                  required
                  disabled={isUpdatingEmployee}
                />
              </div>

              <div>
                <label htmlFor="edit-employee-position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  id="edit-employee-position"
                  value={employeeFormData.position}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter employee position"
                  required
                  disabled={isUpdatingEmployee}
                />
              </div>

              <div>
                <label htmlFor="edit-employee-role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  id="edit-employee-role"
                  value={employeeFormData.role}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value as "admin" | "user" })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  required
                  disabled={isUpdatingEmployee}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditEmployeeModalOpen(false);
                    setEditingEmployee(null);
                    setEmployeeFormData({ name: '', position: '', role: 'user' });
                  }}
                  disabled={isUpdatingEmployee}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmployee}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isUpdatingEmployee ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    showBlockConfirm.targetStatus === 'inactive' ? 'bg-red-100' : 'bg-green-100'
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      showBlockConfirm.targetStatus === 'inactive' ? 'text-red-600' : 'text-green-600'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {showBlockConfirm.targetStatus === 'inactive' ? 'Block Employee' : 'Activate Employee'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {showBlockConfirm.targetStatus === 'inactive'
                      ? 'This action will restrict access'
                      : 'This action will restore access for this employee'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 leading-relaxed">
                {showBlockConfirm.targetStatus === 'inactive' ? (
                  <>
                    Are you sure you want to block{' '}
                    <span className="font-semibold text-gray-900">
                      {showBlockConfirm.employeeName}?
                    </span>{' '}
                    They will not be able to log in to the workspace until you unblock them.
                  </>
                ) : (
                  <>
                    Are you sure you want to activate{' '}
                    <span className="font-semibold text-gray-900">
                      {showBlockConfirm.employeeName}?
                    </span>{' '}
                    They will be able to log in to the workspace again.
                  </>
                )}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={handleCancelBlock}
                disabled={togglingEmployeeId === showBlockConfirm.employeeId}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={togglingEmployeeId === showBlockConfirm.employeeId}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  showBlockConfirm.targetStatus === 'inactive' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {togglingEmployeeId === showBlockConfirm.employeeId ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {showBlockConfirm.targetStatus === 'inactive' ? 'Blocking...' : 'Activating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {showBlockConfirm.targetStatus === 'inactive' ? 'Yes, Block Employee' : 'Yes, Activate Employee'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
