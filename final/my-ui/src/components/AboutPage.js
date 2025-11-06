import { motion } from "framer-motion";
import AssembleLogo from "../components/AssembleLogo";
import "../App.css";

function AboutPage() {
  // 재사용 가능한 animation variant 정의
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <main
      style={{
        padding: "0",
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        marginTop: "0",
      }}
    >
      {/* Hero Section */}
      <motion.section
        style={{
          position: "relative",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 80px",
          background: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
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
          ABOUT US
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
          Assemble과 함께
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
          AI 인테리어 디자인의 새로운 지평을 경험해보세요
        </motion.p>
      </motion.section>

      {/* Section 1: Core Values */}
      <motion.section
        className="section-common section-light-bg"
        style={{
          padding: "100px 20px",
          textAlign: "center",
          background: "#1a1a1a",
        }}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.h2
          className="main-heading"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            marginBottom: "15px",
            color: "#fff",
          }}
          variants={fadeUp}
        >
          핵심 가치
        </motion.h2>

        <motion.p
          className="sub-heading"
          style={{
            fontSize: "1.2rem",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "70px",
            maxWidth: "600px",
            margin: "0 auto 70px",
          }}
          variants={fadeUp}
        >
          혁신적인 기술로 모두가 쉽게 접근할 수 있는 디자인을 제공합니다
        </motion.p>

        <motion.div
          className="value-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
          variants={staggerContainer}
        >
          {[
            {
              emoji: "🤖",
              title: "혁신적인 AI 디자인",
              desc: "최첨단 AI 기술로 당신의 취향에 맞는 맞춤형 인테리어 제안",
              gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            },
            {
              emoji: "✨",
              title: "손쉬운 공간 변환",
              desc: "몇 번의 클릭만으로 빈 방을 꿈의 공간으로 완벽하게 연출",
              gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            },
            {
              emoji: "💡",
              title: "무한한 아이디어 제공",
              desc: "다양한 스타일과 컨셉으로 당신의 영감을 현실로 구현",
              gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            },
            {
              emoji: "⚡",
              title: "시간과 비용 절약",
              desc: "효율적인 AI 디자인으로 프로젝트 기간과 비용을 획기적으로 절감",
              gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            },
            {
              emoji: "🔄",
              title: "지속적인 업데이트",
              desc: "최신 디자인 트렌드와 기술을 반영하여 항상 새로운 경험 제공",
              gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            },
            {
              emoji: "🌍",
              title: "글로벌 디자인 트렌드",
              desc: "전 세계의 다양한 디자인 트렌드를 반영한 인테리어 솔루션",
              gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="value-item"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                padding: "40px 30px",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              variants={fadeUp}
              whileHover={{
                y: -10,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 25px",
                  fontSize: "3.5em",
                }}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                {item.emoji}
              </motion.div>
              <h3
                style={{
                  fontSize: "1.4em",
                  fontWeight: 700,
                  marginBottom: "15px",
                  color: "#fff",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "1rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: "1.7",
                }}
              >
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Section 2: Vision */}
      <motion.section
        className="section-common section-vision"
        style={{
          padding: "100px 20px",
          background: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            opacity: 0.4,
          }}
        />

        <motion.div style={{ position: "relative", zIndex: 1 }}>
          <motion.h2
            className="main-heading"
            style={{
              color: "#fff",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              marginBottom: "20px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            }}
            variants={fadeUp}
          >
            우리의 비전
          </motion.h2>

          <motion.p
            className="sub-heading"
            style={{
              fontSize: "1.3rem",
              color: "rgba(255,255,255,0.95)",
              marginBottom: "30px",
              maxWidth: "700px",
              margin: "0 auto 30px",
              lineHeight: "1.8",
            }}
            variants={fadeUp}
          >
            Assemble과 함께 만들어갈 당신만의 공간 스토리를 기대합니다
          </motion.p>

          <motion.div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 30px",
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(10px)",
              borderRadius: "50px",
              marginBottom: "80px",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
            variants={fadeUp}
            whileHover={{ scale: 1.05 }}
          >
            <i className="fas fa-chevron-circle-right" style={{ fontSize: "1.2em" }}></i>
            <span style={{ fontSize: "1.1em", fontWeight: 600, color: "#fff" }}>
              우리의 여정을 확인하세요
            </span>
          </motion.div>

          <motion.div
            className="story-cards"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
            variants={staggerContainer}
          >
            {[
              {
                text: "고객의 만족을 최우선으로, 우리는 끊임없이 기술과 디자인을 연구합니다.",
                title: "우리의 비전",
                icon: "fas fa-rocket",
                emoji: "🚀",
              },
              {
                text: "AI 기술을 통해 인테리어 디자인의 장벽을 낮추고 모두에게 제공합니다.",
                title: "핵심 가치",
                icon: "fas fa-heart",
                emoji: "❤️",
              },
              {
                text: "열정적인 팀원들이 만들어가는 Assemble의 미래를 함께하세요.",
                title: "팀 소개",
                icon: "fas fa-users",
                emoji: "👥",
              },
            ].map((card, index) => (
              <motion.div
                key={index}
                className="story-card"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: "#fff",
                  padding: "40px",
                  borderRadius: "20px",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                variants={fadeUp}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 45px rgba(0,0,0,0.5)",
                  transition: { duration: 0.3 },
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    fontSize: "8em",
                    opacity: 0.1,
                  }}
                  whileHover={{ rotate: 15, scale: 1.2 }}
                  transition={{ duration: 0.4 }}
                >
                  <i className={card.icon}></i>
                </motion.div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <motion.div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "25px",
                      fontSize: "3.5em",
                    }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {card.emoji}
                  </motion.div>
                  <h3
                    style={{
                      fontSize: "1.8em",
                      fontWeight: 800,
                      marginBottom: "15px",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "1.1em",
                      lineHeight: "1.7",
                      opacity: 0.95,
                    }}
                  >
                    {card.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
}

export default AboutPage;
