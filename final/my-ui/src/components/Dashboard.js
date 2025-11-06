import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ProjectStats from "./ProjectStats";
import ProjectCards from "./ProjectCards";
import ProjectTable from "./ProjectTable";
import NewProjectModal from "./NewProjectModal";
import { getProjects, getStats } from "../api/projectAPI";
import "../App.css";

const DEFAULT_STATS = {
  total_projects: 0,
  in_progress: 0,
  completed: 0,
  recent_increase: 0,
};

const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return "pending";
  const value = rawStatus.toString().trim().toLowerCase();
  if (value === "진행중" || value === "진행 중") return "progress";
  if (value === "완료") return "completed";
  if (value === "대기" || value === "대기중") return "pending";
  return value;
};

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

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

  const loadFallbackProjects = useCallback(() => {
    const stored = localStorage.getItem("projects");
    if (!stored) {
      setProjects([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        setProjects([]);
        return;
      }

      const userProjects = parsed
        .filter((item) => item.userId === userId || item.user_id === userId)
        .map((project) => ({
          ...project,
          id: project.id,
          status: normalizeStatus(project.status),
          project_image:
            project.project_image || project.imagePreview || project.image || "",
          created_at:
            project.created_at || project.createdAt || project.created_at || null,
          updated_at:
            project.updated_at || project.updatedAt || project.updated_at || null,
          residence_type:
            project.residence_type || project.type || project.residenceType || "",
          space_type:
            project.space_type || project.space || project.spaceType || "",
          budget_range:
            project.budget_range || project.budget || project.budgetRange || "",
          family_type:
            project.family_type || project.family || project.familyType || "",
          design_style:
            project.design_style || project.style || project.designStyle || "",
        }));

      setProjects(userProjects);
      setStats({
        total_projects: userProjects.length,
        in_progress: userProjects.filter((project) => project.status === "progress")
          .length,
        completed: userProjects.filter((project) => project.status === "completed")
          .length,
        recent_increase: 0,
      });
    } catch (error) {
      console.error("❌ 로컬 프로젝트 파싱 실패:", error);
      setProjects([]);
    }
  }, [userId]);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setStats(DEFAULT_STATS);
      return;
    }

    try {
      const [projectResponse, statsResponse] = await Promise.all([
        getProjects(userId),
        getStats(userId),
      ]);

      const normalizedProjects = Array.isArray(projectResponse)
        ? projectResponse.map((project) => ({
            ...project,
            status: normalizeStatus(project.status),
            project_image:
              project.project_image || project.imagePreview || project.image || "",
            created_at:
              project.created_at || project.createdAt || project.created_at || null,
            updated_at:
              project.updated_at || project.updatedAt || project.updated_at || null,
            residence_type: project.residence_type || "",
            space_type: project.space_type || "",
            budget_range: project.budget_range || "",
            family_type: project.family_type || "",
            design_style: project.design_style || "",
          }))
        : [];

      setProjects(normalizedProjects);
      setStats({ ...DEFAULT_STATS, ...(statsResponse || {}) });
    } catch (error) {
      console.error("❌ 대시보드 데이터 로드 실패:", error);
      loadFallbackProjects();
    }
  }, [userId, loadFallbackProjects]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProjectCreated = (result) => {
    setIsModalOpen(false);
    fetchData();
    if (result?.project_id) {
      navigate(`/results/${result.project_id}`);
    }
  };

  const handleStatusUpdated = (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, status: normalizeStatus(newStatus) }
          : project
      )
    );
    fetchData();
  };

  const progressProjects = useMemo(
    () =>
      projects.filter((project) => {
        const status = normalizeStatus(project.status);
        return status === "progress";
      }),
    [projects]
  );

  const hasProjects = projects.length > 0;

  return (
    <main
      className="dashboard-page"
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
      }}
    >
      {/* Hero */}
      <motion.section
        style={{
          position: "relative",
          height: "65vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 80px",
          background:
            "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat",
          color: "#fff",
          marginBottom: "50px",
        }}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <motion.span
          style={{
            display: "inline-block",
            padding: "10px 25px",
            border: "2px solid rgba(255, 107, 53, 0.8)",
            borderRadius: "30px",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            marginBottom: "30px",
            color: "#ff6b35",
            background: "rgba(0, 0, 0, 0.35)",
          }}
          variants={fadeUp}
        >
          PROJECT DASHBOARD
        </motion.span>

        <motion.h1
          style={{
            fontSize: "clamp(3rem, 6vw, 4.5rem)",
            fontWeight: 900,
            margin: "0 0 20px",
            lineHeight: 1.2,
            textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
          }}
          variants={fadeUp}
        >
          My Projects
        </motion.h1>

        <motion.p
          style={{
            fontSize: "1.25rem",
            opacity: 0.9,
            margin: 0,
            maxWidth: "560px",
            lineHeight: 1.6,
          }}
          variants={fadeUp}
        >
          진행 중인 프로젝트와 현황을 한눈에 확인하고, 새로운 프로젝트를 바로 생성해
          보세요.
        </motion.p>

        <motion.button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            marginTop: "35px",
            padding: "16px 40px",
            background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "15px",
            fontSize: "1.05rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 15px 30px rgba(255, 107, 53, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
          whileHover={{ scale: 1.02, boxShadow: "0 22px 40px rgba(255, 107, 53, 0.45)" }}
          whileTap={{ scale: 0.96 }}
        >
          <i className="fas fa-plus" /> 새 프로젝트 생성
        </motion.button>
      </motion.section>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 30px 60px" }}>
        <motion.section
          style={{ marginBottom: "60px" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <ProjectStats stats={stats} onNewProject={() => setIsModalOpen(true)} />
        </motion.section>

        {hasProjects ? (
          <>
            <motion.section
              style={{ marginBottom: "60px" }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp}>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: "0 0 20px",
                    color: "#fff",
                  }}
                >
                  현재 진행중인 프로젝트
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "25px" }}>
                  카드당 4개씩 확인하고, 이전/다음 버튼으로 다른 프로젝트도
                  살펴보세요.
                </p>
              </motion.div>
              {progressProjects.length > 0 ? (
                <ProjectCards projects={progressProjects} />
              ) : (
                <motion.div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "20px",
                    padding: "40px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    textAlign: "center",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                  variants={fadeUp}
                >
                  진행 중인 프로젝트가 아직 없습니다. 프로젝트 상태를 &quot;진행
                  중&quot;으로 업데이트하면 여기에서 확인할 수 있어요.
                </motion.div>
              )}
            </motion.section>

            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  color: "#fff",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
                    마이 프로젝트
                  </h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: "10px" }}>
                    최근 프로젝트를 5개씩 확인하고 상태를 바로 변경할 수 있습니다.
                  </p>
                </div>
              </div>
              <ProjectTable projects={projects} onStatusChange={handleStatusUpdated} />
            </motion.section>
          </>
        ) : (
          <motion.section
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <motion.div
              style={{ fontSize: "4em", marginBottom: "20px" }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              📁
            </motion.div>
            <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: 15 }}>
              아직 프로젝트가 없습니다
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "1.1rem" }}>
              새 프로젝트를 생성하여 인테리어 디자인을 시작해보세요!
            </p>
            <motion.button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                marginTop: "25px",
                padding: "16px 40px",
                background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "15px",
                fontSize: "1.05rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 15px 30px rgba(255, 107, 53, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
              }}
              whileHover={{ scale: 1.05, boxShadow: "0 22px 42px rgba(255, 107, 53, 0.45)" }}
              whileTap={{ scale: 0.96 }}
            >
              <i className="fas fa-plus" /> 첫 프로젝트 만들기
            </motion.button>
          </motion.section>
        )}
      </div>

      {isModalOpen && (
        <NewProjectModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </main>
  );
}

export default Dashboard;
