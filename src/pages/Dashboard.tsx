import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, RefreshCw, Database } from 'lucide-react';
import { User as UserType } from '../types';

const Dashboard: React.FC = () => {
  const { logout: logoutContext, user: authUser } = useAuth();

  // Fetch profile data
  const { data: profile, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await axiosClient.get<UserType>('/user/profile');
      return data;
    },
  });

  // Logout Mutation: Call server to invalidate refresh token, then clear client state
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      // Even if this call fails (e.g. network error), we still want to log out on client
      if (refreshToken) {
         await axiosClient.post('/auth/logout', { refreshToken });
      }
    },
    onSettled: () => {
      // Clean up client state regardless of server response
      logoutContext();
    }
  });

  const handleManualRefresh = () => {
     refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Welcome back, {authUser?.username}!</p>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              User Profile
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          
          {isLoading ? (
             <div className="animate-pulse space-y-3">
               <div className="h-4 bg-slate-200 rounded w-3/4"></div>
               <div className="h-4 bg-slate-200 rounded w-1/2"></div>
             </div>
          ) : isError ? (
            <div className="text-red-600 bg-red-50 p-3 rounded text-sm">
               Error loading profile: {(error as any)?.message}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">ID</span>
                <span className="font-mono text-sm">{profile?.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">Email</span>
                <span className="text-sm font-medium">{profile?.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm">Role</span>
                <span className="text-sm font-medium capitalize">{profile?.role}</span>
              </div>
            </div>
          )}
        </div>

        {/* Technical Demo Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
               <Database className="w-5 h-5 text-indigo-600" />
               Auth Logic Tester
             </h3>
          </div>
          
          <div className="text-sm text-slate-600 mb-6">
             <p className="mb-2">The <strong>Access Token</strong> in this demo expires every <strong>10 seconds</strong>.</p>
             <p>Click "Fetch Data" after 10s to verify the silent refresh flow.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleManualRefresh}
              disabled={isFetching}
              className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isFetching ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Fetching...' : 'Fetch Protected Data'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-600">
            {isFetching ? 'Requesting GET /api/user/profile...' : 'Last request completed successfully.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;