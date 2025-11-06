import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  adminGetPendingUsers,
  adminGetUsers,
  adminApprovePendingUser,
  adminRejectPendingUser,
  adminDeletePendingUser,
  adminDeleteUser,
} from "../api/projectAPI";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ 새로고침 시 localStorage에서 로그인 상태 복원
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const storedName = localStorage.getItem("user_name");
    const storedRole = localStorage.getItem("user_role");

    if (storedUserId) {
      setUser({
        user_id: storedUserId,
        name: storedName,
        role: storedRole,
      });
      setIsAuthenticated(true);
    }
  }, []);

  // ✅ 로그인
  const login = async (user_id, password) => {
    try {
      const res = await loginUser(user_id, password);
      // 상태 및 localStorage 갱신
      setUser({
        user_id: res.user_id,
        name: res.name,
        role: res.role,
      });
      localStorage.setItem("user_id", res.user_id);
      localStorage.setItem("user_name", res.name);
      localStorage.setItem("user_role", res.role);
      setIsAuthenticated(true);
      return { success: true, user: res };
    } catch (err) {
      console.error("❌ 로그인 실패:", err);
      return { success: false, error: "loginFailed" };
    }
  };

  const isAdmin = user?.role === "ADMIN";

  // ✅ 회원가입
  const register = async (username, email, password) => {
    try {
      await registerUser(username, password, { email });
      return { success: true, pending: true };
    } catch (err) {
      console.error("❌ 회원가입 실패:", err);
      const serverError = err.response?.data?.error;
      if (serverError?.includes("이미 존재하는 아이디")) {
        return { success: false, error: "userExists" };
      }
      if (serverError?.includes("가입 요청이 진행 중")) {
        return { success: false, error: "userPending" };
      }
      return { success: false, error: "registerFailed" };
    }
  };

  // ✅ 로그아웃
  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    setUser(null);
    setIsAuthenticated(false);
  };

  const adminId = user?.user_id;

  const fetchPendingUsers = useCallback(
    async (statusFilter = "pending") => {
      if (!isAdmin || !adminId) return [];
      return adminGetPendingUsers(adminId, statusFilter);
    },
    [adminId, isAdmin]
  );

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin || !adminId) return [];
    return adminGetUsers(adminId);
  }, [adminId, isAdmin]);

  const approvePendingUser = useCallback(
    async (pendingId) => {
      if (!isAdmin || !adminId) throw new Error("관리자 권한이 필요합니다.");
      await adminApprovePendingUser(adminId, pendingId);
      return { success: true };
    },
    [adminId, isAdmin]
  );

  const rejectPendingUser = useCallback(
    async (pendingId, reason) => {
      if (!isAdmin || !adminId) throw new Error("관리자 권한이 필요합니다.");
      await adminRejectPendingUser(adminId, pendingId, reason);
      return { success: true };
    },
    [adminId, isAdmin]
  );

  const deletePendingRequest = useCallback(
    async (pendingId) => {
      if (!isAdmin || !adminId) throw new Error("관리자 권한이 필요합니다.");
      await adminDeletePendingUser(adminId, pendingId);
      return { success: true };
    },
    [adminId, isAdmin]
  );

  const deleteUserAccount = useCallback(
    async (targetUserId) => {
      if (!isAdmin || !adminId) throw new Error("관리자 권한이 필요합니다.");
      await adminDeleteUser(adminId, targetUserId);
      return { success: true };
    },
    [adminId, isAdmin]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        register,
        fetchPendingUsers,
        fetchAllUsers,
        approvePendingUser,
        rejectPendingUser,
        deletePendingRequest,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
