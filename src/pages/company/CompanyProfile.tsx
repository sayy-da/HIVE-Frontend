import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getCompanyProfile, updateCompany, changeCompanyPassword, Company } from '../../API/company.api';
import { errorPopup, successPopup } from '../../utils/popup';
import { Edit, X, Lock, ArrowLeft, Building2, Mail, MapPin, Save, Eye, EyeOff } from 'lucide-react';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const companyState = useSelector((state: RootState) => state.company);
  const { accessToken } = companyState;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!accessToken) {
      navigate('/company/login');
      return;
    }
    loadCompanyProfile();
  }, [accessToken, navigate]);

  const loadCompanyProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await getCompanyProfile();
      setCompany(profile);
      setEditFormData({
        name: profile.name || '',
        address: profile.address || '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load company profile';
      errorPopup(errorMessage);
      if (error.response?.status === 401) {
        navigate('/company/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (company) {
      setEditFormData({
        name: company.name || '',
        address: company.address || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (company) {
      setEditFormData({
        name: company.name || '',
        address: company.address || '',
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.name.trim()) {
      errorPopup('Company name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedCompany = await updateCompany(company?._id || '', {
        name: editFormData.name.trim(),
        address: editFormData.address.trim(),
      });
      setCompany(updatedCompany);
      setIsEditing(false);
      successPopup('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update profile';
      errorPopup(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      errorPopup('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      errorPopup('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errorPopup('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errorPopup('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeCompanyPassword(passwordData.currentPassword, passwordData.newPassword);
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      successPopup('Password changed successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to change password';
      errorPopup(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForgotPassword = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Close the change password modal first
    setShowChangePassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswords({ current: false, new: false, confirm: false });
    // Navigate to forgot password page
    // PublicRoute now allows forgot password pages even for authenticated users
    navigate('/company/forgot-password');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/company')}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Company Profile</h1>
              <p className="text-gray-600 mt-1">Manage your company information and security</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden backdrop-blur-sm">
          <div className="p-8">
            {!isEditing ? (
              // View Mode
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Information</h2>
                    <p className="text-sm text-gray-500">View and manage your company details</p>
                  </div>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="font-medium">Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      Company Name
                    </label>
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-gray-900 border-2 border-gray-200 group-hover:border-indigo-300 transition-colors font-medium">
                      {company?.name || 'N/A'}
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Mail className="h-4 w-4 text-indigo-600" />
                      Email Address
                    </label>
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-gray-900 border-2 border-gray-200 group-hover:border-indigo-300 transition-colors font-medium">
                      {company?.email || 'N/A'}
                    </div>
                  </div>

                  <div className="md:col-span-2 group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      Address
                    </label>
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-gray-900 border-2 border-gray-200 group-hover:border-indigo-300 transition-colors min-h-[60px] flex items-center">
                      <span className="font-medium">{company?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="pt-8 border-t-2 border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Lock className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Password Security</h3>
                        <p className="text-sm text-gray-600">Keep your account secure with a strong password</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium whitespace-nowrap"
                    >
                      <Lock className="h-4 w-4" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Company Information</h2>
                    <p className="text-sm text-gray-500">Update your company details</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="edit-name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      Company Name *
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium"
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Mail className="h-4 w-4 text-indigo-600" />
                      Email Address
                    </label>
                    <div className="px-5 py-4 bg-gray-50 rounded-xl text-gray-500 border-2 border-gray-200 font-medium">
                      {company?.email || 'N/A'}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="edit-address" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      Address
                    </label>
                    <textarea
                      id="edit-address"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      rows={4}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white resize-none font-medium"
                      placeholder="Enter company address"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-200 scale-100">
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Lock className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
                className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                disabled={isChangingPassword}
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              <div>
                <label htmlFor="current-password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-5 py-4 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  New Password *
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-5 py-4 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  Must be at least 6 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-5 py-4 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && (
                  <p className={`text-xs mt-2 flex items-center gap-1 ${
                    passwordData.newPassword === passwordData.confirmPassword 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Passwords match
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setShowPasswords({ current: false, new: false, confirm: false });
                  }}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[CompanyProfile] Forgot password button clicked');
                    handleForgotPassword(e);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1 w-full text-left hover:underline"
                >
                  <span>Forgot your password?</span>
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

