import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setShowModal(true);
      const timer = setTimeout(() => {
        setShowModal(false);
        setRedirect(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAdmin]);

  if (redirect) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <AnimatePresence>
        {showModal && (
          <motion.div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              backdropFilter: "blur(5px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                background: "#fff",
                padding: "50px 60px",
                borderRadius: "25px",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                textAlign: "center",
                maxWidth: "500px",
              }}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "0 auto 25px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <i className="fas fa-shield-alt" style={{ fontSize: "2.5em", color: "#fff" }}></i>
              </motion.div>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#333",
                  marginBottom: "15px",
                }}
              >
                관리자 권한이 필요합니다
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#6c757d",
                  marginBottom: "0",
                }}
              >
                홈 페이지로 이동합니다...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return children;
}

export default AdminRoute;
