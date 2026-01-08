import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiChevronLeft, FiChevronRight, FiX, FiLogOut, FiArrowLeft, FiMail, FiMapPin, FiUsers, FiCalendar, FiGlobe, FiPhone, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { HiOutlineUsers, HiOutlineHome, HiOutlineCreditCard, HiOutlineDocumentText } from 'react-icons/hi';
import { Company } from '../../API/company.api';
import { getAllCompanies, updateCompanyByAdmin } from '../../API/admin.api';
import { adminLogout } from '../../API/admin.api';  
import { logout } from '../../features/admin/adminSlice';
import { AppDispatch, RootState } from '../../store';
import { errorPopup, successPopup } from '../../utils/popup';

export default function CompanyTable() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken } = useSelector((state: RootState) => state.admin);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Route protection: redirect to login if not authenticated
  useEffect(() => {
    if (!accessToken) {
      navigate("/admin/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    // Only fetch companies if authenticated
    if (!accessToken) return;

    async function fetchCompanies() {
      try {
        setIsLoading(true);
        const data = await getAllCompanies();
        setCompanies(data);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to fetch companies";
        errorPopup(errorMessage);
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanies();
  }, [accessToken]);

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCompany(null);
  };


  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;

    // Show confirmation if changing to inactive
    if (editStatus === 'inactive' && selectedCompany.status === 'active') {
      setShowInactiveConfirm(true);
      return;
    }

    // Proceed with update
    await performUpdateCompany();
  };

  const performUpdateCompany = async () => {
    if (!selectedCompany) return;

    setIsUpdating(true);
    try {
      await updateCompanyByAdmin(selectedCompany._id, { status: editStatus });
      successPopup("Company status updated successfully");
      
      const data = await getAllCompanies();
      setCompanies(data);
      
      const updated = data.find(c => c._id === selectedCompany._id);
      if (updated) {
        setSelectedCompany(updated);
      }
      
      setIsEditModalOpen(false);
      setShowInactiveConfirm(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to update company";
      errorPopup(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmInactive = () => {
    performUpdateCompany();
  };

  const handleCancelInactive = () => {
    setShowInactiveConfirm(false);
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      dispatch(logout());
      successPopup("Logged out successfully");
      navigate("/admin/login", { replace: true });  
    } catch (error: any) {
      // Even if logout API fails, clear local state and redirect
      dispatch(logout());
      navigate("/admin/login", { replace: true });
    }
  };

  // Company Detail View
  if (viewMode === 'detail' && selectedCompany) {
    const createdAt = selectedCompany.createdAt 
      ? new Date(selectedCompany.createdAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A';

    const status = selectedCompany.status || (selectedCompany.isEmailVerified ? 'active' : 'inactive');
    const isActive = status === 'active';

    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Sidebar */}
        <div className="w-14 bg-white flex flex-col items-center py-3 ml-6 my-8 shadow-lg" style={{ borderRadius: '25px', height: 'calc(100vh - 130px)' }}>
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
            <HiOutlineUsers className="text-white text-base" />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
              <HiOutlineHome className="text-base" />
            </div>
            <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
              <HiOutlineCreditCard className="text-base" />
            </div>
            <div className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg">
              <HiOutlineUsers className="text-base" />
            </div>
            <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
              <HiOutlineDocumentText className="text-base" />
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center gap-2">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="User" 
              className="w-7 h-7 rounded-full"
            />
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut className="text-gray-600 text-sm" />
            </button>
          </div>
        </div>

        {/* Main Content - Company Detail */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header with Back Button */}
            <div className="mb-8">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
              >
                <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Companies</span>
              </button>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Details</h1>
                  <p className="text-gray-600">View and manage company information</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Status Toggle Button */}
                  {isActive ? (
                    <button
                      onClick={() => {
                        setEditStatus('inactive');
                        setShowInactiveConfirm(true);
                      }}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiXCircle className="w-4 h-4" />
                      Deactivate Company
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditStatus('active');
                        setShowInactiveConfirm(true);
                      }}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Activating...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="w-4 h-4" />
                          Activate Company
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Company Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header Section with Avatar */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-blue-600">
                      {selectedCompany.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-white">{selectedCompany.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {isActive ? (
                          <>
                            <FiCheckCircle className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <FiXCircle className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-blue-100 text-lg">{selectedCompany.email}</p>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiMail className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</h3>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{selectedCompany.email}</p>
                  </div>

                  {/* Address */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiMapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</h3>
                    </div>
                    <p className="text-lg font-medium text-gray-900 capitalize">{selectedCompany.address || 'N/A'}</p>
                  </div>

                  {/* Employee Count */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FiUsers className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Employee Count</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedCompany.count || 0}</p>
                  </div>

                  {/* Created Date */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FiCalendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Created Date</h3>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{createdAt}</p>
                  </div>

                  {/* Website */}
                  {selectedCompany.website && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <FiGlobe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Website</h3>
                      </div>
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}

                  {/* Phone */}
                  {selectedCompany.phone && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FiPhone className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Phone</h3>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{selectedCompany.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Company Modal */}
        {isEditModalOpen && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Company Status</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isUpdating}
                >
                  <FiX className="text-gray-600 text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <p className="text-sm text-gray-900">{selectedCompany.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{selectedCompany.email}</p>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "active" | "inactive")}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompany}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Confirmation Modal (Activate / Deactivate) */}
        {showInactiveConfirm && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    editStatus === 'inactive' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <svg
                      className={`w-6 h-6 ${editStatus === 'inactive' ? 'text-red-600' : 'text-green-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {editStatus === 'inactive' ? 'Deactivate Company' : 'Activate Company'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {editStatus === 'inactive'
                        ? 'This action will restrict access'
                        : 'This action will restore access to this company and its employees'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5">
                <p className="text-gray-700 leading-relaxed">
                  {editStatus === 'inactive' ? (
                    <>
                      Are you sure you want to deactivate{' '}
                      <span className="font-semibold text-gray-900">{selectedCompany.name}</span>? The company and all its
                      employees will not be able to log in until you reactivate them.
                    </>
                  ) : (
                    <>
                      Are you sure you want to activate{' '}
                      <span className="font-semibold text-gray-900">{selectedCompany.name}</span>? The company and its
                      employees will be able to log in again.
                    </>
                  )}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelInactive}
                  disabled={isUpdating}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInactive}
                  disabled={isUpdating}
                  className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    editStatus === 'inactive' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editStatus === 'inactive' ? 'Deactivating...' : 'Activating...'}
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
                      {editStatus === 'inactive' ? 'Yes, Deactivate Company' : 'Yes, Activate Company'}
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

  // Company List View
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-14 bg-gray-100 flex flex-col items-center py-3 ml-6 my-8" style={{ borderRadius: '25px', height: 'calc(100vh - 130px)' }}>
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
          <HiOutlineUsers className="text-white text-base" />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <HiOutlineHome className="text-base" />
          </div>
          <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <HiOutlineCreditCard className="text-base" />
          </div>
          <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <HiOutlineUsers className="text-base" />
          </div>
          <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <HiOutlineDocumentText className="text-base" />
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center gap-2">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User" 
            className="w-7 h-7 rounded-full"
          />
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Logout"
          >
            <FiLogOut className="text-gray-600 text-sm" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">All Companies</h1>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading companies...
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  companies
                    .filter((company) => {
                      const query = searchQuery.toLowerCase();
                      return (
                        company.name?.toLowerCase().includes(query) ||
                        company.email?.toLowerCase().includes(query) ||
                        company.address?.toLowerCase().includes(query)
                      );
                    })
                    .map((company) => {
                      const createdAt = company.createdAt 
                        ? new Date(company.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'N/A';
                      
                      const status = company.status || (company.isEmailVerified ? 'active' : 'inactive');
                      const isActive = status === 'active';
                      
                      return (
                        <tr 
                          key={company._id} 
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleCompanyClick(company)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{company.email || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">{company.address || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{company.count || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{createdAt}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isActive ? (
                                <>
                                  <FiCheckCircle className="w-3 h-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <FiXCircle className="w-3 h-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {companies.length > 0 ? `1 to ${companies.length}` : '0'} of {companies.length} entries
            </p>
            
            <div className="flex items-center gap-2">
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <FiChevronLeft className="text-gray-600" />
              </button>
              
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                1
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                4
              </button>
              <span className="px-2 text-gray-400">...</span>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                40
              </button>
              
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <FiChevronRight className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
