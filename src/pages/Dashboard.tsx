import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, RefreshCw, Database, Terminal, Trash2 } from 'lucide-react';
import type { User as UserType } from '../types';

const Dashboard: React.FC = () => {
  const { logout: logoutContext, user: authUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  
  // Ref để tự động cuộn xuống cuối console
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Hàm thêm log vào màn hình
  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  // Tự động cuộn khi có log mới
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    // Hàm xử lý khi nghe thấy tín hiệu 401
    const handle401 = () => {
      addLog('⚠️ Interceptor caught 401! Auto-refreshing token...');
    };

    // Đăng ký lắng nghe
    window.addEventListener('auth:401', handle401);

    // Dọn dẹp khi component bị hủy
    return () => window.removeEventListener('auth:401', handle401);
  }, []); // Chạy 1 lần khi mount

  // Fetch profile data
  const { data: profile, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      addLog('🚀 Sending request to GET /user/profile...');
      try {
        const { data } = await axiosClient.get<UserType>('/user/profile');
        addLog('✅ Received data successfully.');
        return data;
      } catch (err: any) {
        // Nếu lỗi 401, Axios interceptor sẽ xử lý ngầm, nhưng ở đây ta vẫn log lỗi ban đầu
        if (err.response?.status === 401) {
           addLog('⚠️ Got 401 Unauthorized. Auto-refresh logic in Axios should trigger now...');
        } else {
           addLog(`❌ Request failed: ${err.message}`);
        }
        throw err;
      }
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      addLog('🚪 Logging out...');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
         await axiosClient.post('/auth/logout', { refreshToken });
      }
    },
    onSuccess: () => {
      addLog('✅ Logout successful on server.');
    },
    onSettled: () => {
      logoutContext();
    }
  });

  const handleManualRefresh = () => {
     refetch();
  };

  const clearConsole = () => setLogs([]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Welcome back, <span className="font-semibold text-indigo-600">{authUser?.username}</span>!</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
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
             <div className="animate-pulse space-y-4">
               <div className="h-4 bg-slate-200 rounded w-3/4"></div>
               <div className="h-4 bg-slate-200 rounded w-1/2"></div>
               <div className="h-4 bg-slate-200 rounded w-2/3"></div>
             </div>
          ) : isError ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg text-sm border border-red-100">
               Error loading profile: {(error as any)?.message}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="group p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">ID</span>
                <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{profile?.id}</span>
              </div>
              <div className="group p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Email</span>
                <span className="text-sm font-medium text-slate-900">{profile?.email}</span>
              </div>
              <div className="group p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Role</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                  {profile?.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Technical Demo Panel with Console */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
               <Database className="w-5 h-5 text-indigo-600" />
               Auth Logic Tester
             </h3>
          </div>
          
          <div className="text-sm text-slate-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
             <p className="flex items-start gap-2">
               <span className="text-blue-500 font-bold">ℹ️</span>
               <span>Access Token hết hạn sau <strong>15 giây</strong>. Hãy chờ và bấm nút bên dưới để xem cơ chế tự động Refresh.</span>
             </p>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isFetching}
            className={`w-full mb-4 flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isFetching ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Fetching Protected Data...' : 'Fetch Protected Data'}
          </button>

          {/* Console Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Terminal className="w-3 h-3" />
                <span className="font-mono">Console Logs</span>
              </div>
              <button 
                onClick={clearConsole}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Clear Console"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {logs.length === 0 && (
                <div className="text-slate-600 italic text-center mt-10">Running... Waiting for events.</div>
              )}
              {logs.map((log, index) => {
                let colorClass = "text-slate-300";
                if (log.includes("❌") || log.includes("⚠️")) colorClass = "text-red-400";
                if (log.includes("✅")) colorClass = "text-green-400";
                if (log.includes("🚀")) colorClass = "text-blue-400";

                return (
                  <div key={index} className={`${colorClass} break-all leading-relaxed`}>
                    {log}
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;