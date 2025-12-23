import { useState } from 'react';
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { HiOutlineUsers, HiOutlineHome, HiOutlineCreditCard, HiOutlineDocumentText } from 'react-icons/hi';

export default function CompanyTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const companies = [
    {
      name: 'ABC company',
      email: 'abc@gmail.com',
      address: 'bangluru',
      count: 13,
      createdAt: '12/10/2025',
      phone: '+91 98765 43210',
      website: 'www.abccompany.com',
      status: 'Active'
    },
    {
      name: 'cdv company',
      email: 'cdv@gmail.com',
      address: 'mumbai',
      count: 20,
      createdAt: '10/4/2025',
      phone: '+91 98765 43211',
      website: 'www.cdvcompany.com',
      status: 'Active'
    },
    {
      name: 'rdft company',
      email: 'rdft@gmail.com',
      address: 'mumbai',
      count: 30,
      createdAt: '21/3/2025',
      phone: '+91 98765 43212',
      website: 'www.rdftcompany.com',
      status: 'Active'
    }
  ];

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

        <div className="mt-3">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User" 
            className="w-7 h-7 rounded-full"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-8 bg-gray-50 transition-all ${selectedCompany ? 'mr-96' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
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

              {/* Sort Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-600">Sort by:</span>
             
                  <FiChevronDown className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
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
                    createdAt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies.map((company, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{company.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.address}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.count}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{company.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing data 1 to 3 of 256K entries
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

      {/* Right Sidebar - Company Details */}
      {selectedCompany && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Company Details</h2>
            <button 
              onClick={() => setSelectedCompany(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-gray-600 text-xl" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {selectedCompany.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                {selectedCompany.name}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCompany.email}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCompany.phone}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Address</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedCompany.address}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Website</label>
                <p className="mt-1 text-sm text-blue-600">{selectedCompany.website}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Employee Count</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCompany.count}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Created Date</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCompany.createdAt}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                <span className="inline-flex items-center mt-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {selectedCompany.status}
                </span>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Company
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}