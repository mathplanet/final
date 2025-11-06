import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";

const formatDate = (value) => {
  if (!value) return "-";
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString("ko-KR");
  } catch {
    return value;
  }
};

function AdminPage() {
  const {
    isAdmin,
    fetchPendingUsers,
    fetchAllUsers,
    approvePendingUser,
    rejectPendingUser,
    deletePendingRequest,
    deleteUserAccount,
  } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // 관리자 권한 확인
  useEffect(() => {
    if (!isAdmin) {
      alert("관리자만 접근할 수 있는 페이지입니다.");
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const [pendingList, userList] = await Promise.all([
        fetchPendingUsers?.("pending") ?? [],
        fetchAllUsers?.() ?? [],
      ]);

      setPendingUsers(Array.isArray(pendingList) ? pendingList : []);
      setAllUsers(Array.isArray(userList) ? userList : []);
    } catch (error) {
      console.error("관리자 데이터 로드 실패:", error);
      alert("관리자 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [fetchAllUsers, fetchPendingUsers, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const handleApprovePending = async (pendingUser) => {
    if (!pendingUser) return;
    const pendingId = pendingUser.user_id || pendingUser.username;
    if (!window.confirm(`${pendingId} 사용자를 승인하시겠습니까?`)) return;

    try {
      await approvePendingUser?.(pendingUser.id);
      alert("승인되었습니다.");
      loadUsers();
    } catch (error) {
      console.error("승인 실패:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleRejectPending = async (pendingUser) => {
    if (!pendingUser) return;
    const pendingId = pendingUser.user_id || pendingUser.username;
    if (!window.confirm(`${pendingId} 사용자를 거부하시겠습니까?`)) return;

    const reason = window.prompt("거절 사유를 입력해주세요 (선택 입력)", pendingUser.rejected_reason || "");

    try {
      await rejectPendingUser?.(pendingUser.id, reason || null);
      alert("거부되었습니다.");
      loadUsers();
    } catch (error) {
      console.error("거부 실패:", error);
      alert("거부 처리 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePending = async (pendingUser) => {
    if (!pendingUser) return;
    const pendingId = pendingUser.user_id || pendingUser.username;
    if (!window.confirm(`${pendingId} 사용자의 요청을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await deletePendingRequest?.(pendingUser.id);
      alert("가입 요청을 삭제했습니다.");
      loadUsers();
    } catch (error) {
      console.error("가입 요청 삭제 실패:", error);
      alert("요청 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user) return;
    const targetId = user.user_id || user.username;
    if (targetId === "admin") {
      alert("관리자 계정은 삭제할 수 없습니다.");
      return;
    }

    if (!window.confirm(`${targetId} 사용자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await deleteUserAccount?.(targetId);
      alert("사용자가 삭제되었습니다.");
      loadUsers();
    } catch (error) {
      console.error("사용자 삭제 실패:", error);
      alert("사용자 삭제 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status) => {
    const normalized = (status || "").toString().toLowerCase();
    const statusStyles = {
      pending: { bg: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)", label: "승인 대기" },
      approved: { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", label: "승인됨" },
      rejected: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", label: "거부됨" },
    };

    const style = statusStyles[normalized] || {
      bg: "linear-gradient(135deg, #9ca3af 0%, #b8bfc9 100%)",
      label: normalized ? normalized.toUpperCase() : "미확인",
    };

    return (
      <span
        style={{
          padding: "6px 14px",
          borderRadius: "12px",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#fff",
          background: style.bg,
          display: "inline-block",
        }}
      >
        {style.label}
      </span>
    );
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        paddingTop: "0",
        marginTop: "0",
      }}
    >
      {/* Header Section */}
      <motion.div
        style={{
          position: "relative",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 80px",
          background: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          marginBottom: "50px",
          marginTop: "0",
        }}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <motion.div
          style={{
            display: "inline-block",
            padding: "10px 25px",
            border: "2px solid rgba(255, 107, 53, 0.8)",
            borderRadius: "30px",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: "1px",
            marginBottom: "30px",
            color: "#ff6b35",
            background: "rgba(0, 0, 0, 0.3)",
          }}
          variants={fadeUp}
        >
          ADMIN CONTROL PANEL
        </motion.div>

        <motion.h1
          style={{
            fontSize: "clamp(3rem, 6vw, 4.5rem)",
            fontWeight: 900,
            margin: "0 0 20px",
            textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
            lineHeight: "1.2",
            maxWidth: "800px",
          }}
          variants={fadeUp}
        >
          관리자 페이지
        </motion.h1>

        <motion.p
          style={{
            fontSize: "1.3rem",
            opacity: 0.95,
            margin: 0,
            maxWidth: "600px",
            lineHeight: "1.6",
          }}
          variants={fadeUp}
        >
          회원 가입 요청을 승인하거나 거부할 수 있습니다
        </motion.p>
      </motion.div>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 30px 60px" }}>
        {/* Tab Navigation */}
        <motion.div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "40px",
            justifyContent: "center",
          }}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <motion.button
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "12px 30px",
              border: "none",
              borderRadius: "15px",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              background:
                activeTab === "pending"
                  ? "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)"
                  : "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              boxShadow:
                activeTab === "pending"
                  ? "0 8px 20px rgba(255, 107, 53, 0.3)"
                  : "0 4px 10px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            승인 대기 ({pendingUsers.length})
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "12px 30px",
              border: "none",
              borderRadius: "15px",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              background:
                activeTab === "all"
                  ? "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)"
                  : "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              boxShadow:
                activeTab === "all"
                  ? "0 8px 20px rgba(255, 107, 53, 0.3)"
                  : "0 4px 10px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            전체 사용자 ({allUsers.length})
          </motion.button>
        </motion.div>

        {/* Pending Users Table */}
        {activeTab === "pending" && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "30px", color: "#fff" }}>
              승인 대기 중인 사용자
            </h2>

            {pendingUsers.length === 0 ? (
              <motion.div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  padding: "60px",
                  textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
                variants={fadeUp}
              >
                <i
                  className="fas fa-check-circle"
                  style={{ fontSize: "4em", color: "#ff6b35", marginBottom: "20px", display: "block" }}
                ></i>
                <h3 style={{ fontSize: "1.5em", color: "#fff", margin: "0 0 10px" }}>
                  승인 대기 중인 사용자가 없습니다
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>모든 요청이 처리되었습니다.</p>
              </motion.div>
            ) : (
              <motion.div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  padding: "30px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                  overflowX: "auto",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
                variants={fadeUp}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(255, 255, 255, 0.1)" }}>
                      <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                        아이디
                      </th>
                      <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                        이메일
                      </th>
                      <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                        신청일
                      </th>
                      <th style={{ padding: "15px", textAlign: "center", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user, index) => (
                      <motion.tr
                        key={index}
                        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      >
                        <td style={{ padding: "20px 15px", fontSize: "1rem", fontWeight: 600, color: "#fff" }}>
                          {user.user_id || user.username}
                        </td>
                        <td style={{ padding: "20px 15px", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.7)" }}>
                          {user.email}
                        </td>
                        <td style={{ padding: "20px 15px", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.7)" }}>
                          {formatDate(user.created_at || user.registeredAt)}
                        </td>
                        <td style={{ padding: "20px 15px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <motion.button
                              onClick={() => handleApprovePending(user)}
                              style={{
                                padding: "8px 20px",
                                border: "none",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
                                color: "#fff",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                boxShadow: "0 4px 10px rgba(255, 107, 53, 0.3)",
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              승인
                            </motion.button>

                            <motion.button
                              onClick={() => handleRejectPending(user)}
                              style={{
                                padding: "8px 20px",
                                border: "none",
                                borderRadius: "10px",
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "#fff",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              거부
                            </motion.button>

                            <motion.button
                              onClick={() => handleDeletePending(user)}
                              style={{
                                padding: "8px 20px",
                                border: "none",
                                borderRadius: "10px",
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "#fff",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              삭제
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* All Users Table */}
        {activeTab === "all" && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "30px", color: "#fff" }}>
              전체 사용자 목록
            </h2>

            <motion.div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: "20px",
                padding: "30px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                overflowX: "auto",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              variants={fadeUp}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255, 255, 255, 0.1)" }}>
                    <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                      아이디
                    </th>
                    <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                      이메일
                    </th>
                    <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                      상태
                    </th>
                    <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                      신청일
                    </th>
                    <th style={{ padding: "15px", textAlign: "left", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                      승인일
                    </th>
                    <th style={{ padding: "15px", textAlign: "center", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user, index) => (
                    <motion.tr
                      key={index}
                      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    >
                      <td style={{ padding: "20px 15px", fontSize: "1rem", fontWeight: 600, color: "#fff" }}>
                        {user.user_id || user.username}
                      </td>
                      <td style={{ padding: "20px 15px", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.7)" }}>
                        {user.email}
                      </td>
                      <td style={{ padding: "20px 15px" }}>{getStatusBadge(user.status)}</td>
                      <td style={{ padding: "20px 15px", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.7)" }}>
                        {formatDate(user.created_at || user.registeredAt)}
                      </td>
                      <td style={{ padding: "20px 15px", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.7)" }}>
                        {user.approved_at ? formatDate(user.approved_at) : user.approvedAt ? formatDate(user.approvedAt) : "-"}
                      </td>
                      <td style={{ padding: "20px 15px", textAlign: "center" }}>
                        <motion.button
                          onClick={() => handleDeleteUser(user)}
                          disabled={(user.user_id || user.username) === "admin"}
                          style={{
                            padding: "10px 24px",
                            border: "none",
                            borderRadius: "12px",
                            background:
                              (user.user_id || user.username) === "admin"
                                ? "rgba(255, 255, 255, 0.1)"
                                : "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
                            color: "#fff",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            cursor: (user.user_id || user.username) === "admin" ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
                            opacity: (user.user_id || user.username) === "admin" ? 0.5 : 1,
                            transition: "all 0.3s ease",
                          }}
                          whileHover={(user.user_id || user.username) !== "admin" ? { scale: 1.05 } : {}}
                          whileTap={(user.user_id || user.username) !== "admin" ? { scale: 0.95 } : {}}
                        >
                          삭제
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.section>
        )}
      </div>
    </main>
  );
}

export default AdminPage;
