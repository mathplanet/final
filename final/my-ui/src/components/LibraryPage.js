import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import "../App.css";

function LibraryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("blog");
  const [newsData, setNewsData] = useState([]);
  const [blogData, setBlogData] = useState([]);
  const [paperData, setPaperData] = useState([]);
  const [paperKeywords, setPaperKeywords] = useState([]);
  const [activeKeyword, setActiveKeyword] = useState("all");
  const [currentPaperPage, setCurrentPaperPage] = useState(1);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isLoadingPaper, setIsLoadingPaper] = useState(true);
  const papersPerPage = 12;

  const normalizeText = (text) => {
    if (!text) return "";
    return text.toString().toLowerCase();
  };

  // Animation variants
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

  // CSV 파일에서 데이터 로드
  useEffect(() => {
    // hanssem_contents.csv 로드
    setIsLoadingContent(true);
    fetch("/hanssem_contents.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data;

            // 날짜 파싱 함수 (YYYY-MM-DD 형식)
            const parseDate = (dateStr) => {
              if (!dateStr) return new Date(0);
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                return new Date(parts[0], parts[1] - 1, parts[2]);
              }
              return new Date(dateStr);
            };

            // 뉴스와 블로그 데이터 분리 및 최신순 정렬
            const news = data
              .filter(item => item.source === 'news')
              .sort((a, b) => parseDate(b.pubdate) - parseDate(a.pubdate))
              .slice(0, 12); // 최신 12개

            const blog = data
              .filter(item => item.source === 'blog')
              .sort((a, b) => parseDate(b.pubdate) - parseDate(a.pubdate))
              .slice(0, 12); // 최신 12개

            setNewsData(news);
            setBlogData(blog);
            setIsLoadingContent(false);
          },
        });
      })
      .catch((error) => {
        console.error("hanssem_contents CSV 로드 오류:", error);
        setIsLoadingContent(false);
      });

    // riss_FIN2.csv 로드 (논문 데이터)
    setIsLoadingPaper(true);
    fetch("/riss_FIN2.csv")
      .then((response) => {
        console.log("riss_FIN2.csv 응답 상태:", response.status);
        return response.text();
      })
      .then((csvText) => {
        console.log("riss_FIN2.csv 텍스트 길이:", csvText.length);
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("파싱된 논문 데이터:", results.data.length, "개");
            console.log("첫 번째 논문:", results.data[0]);

            const data = results.data.map((item, index) => ({
              id: `paper_${index}`,
              database: item.database,
              keyword: item.keyword,
              title: item.title,
              authors: item.authors,
              publisher: item.publisher,
              journal: item.journal,
              issue: item.issue,
              year: item.year,
              link: item.link,
            }));

            console.log("가공된 논문 데이터:", data.length, "개");
            setPaperData(data);

            // keyword로 카테고리 추출
            const uniqueKeywords = [...new Set(data.map((item) => item.keyword))].filter(Boolean);
            console.log("추출된 키워드:", uniqueKeywords);
            setPaperKeywords(uniqueKeywords);
            setIsLoadingPaper(false);
          },
        });
      })
      .catch((error) => {
        console.error("riss_FIN2 CSV 로드 오류:", error);
        setIsLoadingPaper(false);
      });
  }, []);

  // 카테고리 데이터
  const categories = [
    {
      id: "news",
      name: "News & Blogs",
      subtitle: "뉴스 & 블로그",
      icon: "fas fa-newspaper",
    },
    {
      id: "blog",
      name: "Blog Posts",
      subtitle: "블로그 포스트",
      icon: "fas fa-blog",
    },
    {
      id: "paper",
      name: "Research Papers",
      subtitle: "논문",
      icon: "fas fa-file-alt",
    },
  ];

  const filteredBlog = blogData.filter((item) => {
    if (!searchText) return true;
    return normalizeText(item.title).includes(normalizeText(searchText));
  });

  const filteredNews = newsData.filter((item) => {
    if (!searchText) return true;
    return normalizeText(item.title).includes(normalizeText(searchText));
  });

  // 논문 필터링
  const filteredPapersBase = activeKeyword === "all"
    ? paperData
    : paperData.filter(paper => paper.keyword === activeKeyword);

  const filteredPapers = filteredPapersBase.filter((paper) => {
    if (!searchText) return true;
    return normalizeText(paper.title).includes(normalizeText(searchText));
  });

  // 논문 페이지네이션
  const totalPaperPages = Math.ceil(filteredPapers.length / papersPerPage);
  const startPaperIndex = (currentPaperPage - 1) * papersPerPage;
  const endPaperIndex = startPaperIndex + papersPerPage;
  const currentPapers = filteredPapers.slice(startPaperIndex, endPaperIndex);

  // 페이지 번호 생성 (최대 10개)
  const getPaperPageNumbers = () => {
    const maxPagesToShow = 10;
    const pages = [];
    if (totalPaperPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPaperPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPaperPage <= 6) {
        for (let i = 1; i <= 10; i++) {
          pages.push(i);
        }
      } else if (currentPaperPage >= totalPaperPages - 5) {
        for (let i = totalPaperPages - 9; i <= totalPaperPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPaperPage - 4; i <= currentPaperPage + 5; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  };

  // 키워드 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPaperPage(1);
  }, [activeKeyword]);


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
          height: "500px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 80px",
          background: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat",
          color: "#fff",
          marginBottom: "0",
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
          DESIGN RESOURCES
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
          Asset Library
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
          인테리어 디자인 자료와 영감을 찾아보세요
        </motion.p>
      </motion.div>

      {/* Main Content */}
      <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", gap: "30px" }}>
        {/* Sidebar */}
        <motion.aside
          style={{
            width: "280px",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "30px 25px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            margin: "30px 0 30px 30px",
            height: "fit-content",
            position: "sticky",
            top: "100px",
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#fff",
              marginTop: 0,
              marginBottom: "30px",
            }}
          >
            카테고리
          </h2>

          {categories.map((category, index) => (
            <motion.div
              key={index}
              onClick={() => setActiveCategory(category.id)}
              style={{
                marginBottom: "15px",
                padding: "15px",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: activeCategory === category.id
                  ? "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                boxShadow: activeCategory === category.id
                  ? "0 5px 15px rgba(255, 107, 53, 0.3)"
                  : "none",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}>
                <i
                  className={category.icon}
                  style={{
                    fontSize: "1.2rem",
                    color: activeCategory === category.id ? "#fff" : "#ff6b35",
                  }}
                ></i>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: activeCategory === category.id ? "#fff" : "rgba(255, 255, 255, 0.9)",
                    margin: 0,
                  }}
                >
                  {category.name}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: activeCategory === category.id ? "rgba(255,255,255,0.9)" : "rgba(255, 255, 255, 0.6)",
                  paddingLeft: "32px",
                  margin: 0,
                }}
              >
                {category.subtitle}
              </p>
            </motion.div>
          ))}
        </motion.aside>

        {/* Content Area */}
        <div style={{ flex: 1, padding: "30px 30px 30px 0" }}>
          {/* Search Bar */}
          <motion.div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "40px",
              flexWrap: "wrap",
            }}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchText(searchInput.trim());
              }}
              style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}
            >
              <input
                type="text"
                placeholder="Search any documents..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "250px",
                  padding: "14px 20px",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ff6b35";
                  e.target.style.boxShadow = "0 0 0 4px rgba(255, 107, 53, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <motion.button
                type="submit"
                style={{
                  padding: "14px 30px",
                  background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(255, 107, 53, 0.35)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Search
              </motion.button>
            </form>
            <motion.button
              style={{
                padding: "14px 25px",
                background: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
              }}
              whileHover={{ scale: 1.02, background: "rgba(255, 255, 255, 0.2)" }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fas fa-plus"></i>
              자료 업로드
            </motion.button>
          </motion.div>

          {/* Content Section */}
          {activeCategory === "news" && (
            <section style={{ marginBottom: "50px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                }}
              >
                <h2 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#fff" }}>
                  <i className="fas fa-newspaper" style={{ marginRight: "10px", color: "#ff6b35" }}></i>
                  최신 뉴스
                </h2>
              </div>

              {isLoadingContent ? (
                <div style={{
                  textAlign: "center",
                  padding: "100px 20px",
                  color: "#667eea",
                  fontSize: "1.2rem"
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: "3rem", marginBottom: "20px", display: "block" }}></i>
                  뉴스 데이터를 불러오는 중...
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {filteredNews.length > 0 ? (
                    filteredNews.map((item, index) => (
                      <ContentCard key={index} item={item} />
                    ))
                  ) : (
                    <p style={{ color: "#6c757d", gridColumn: "1 / -1" }}>
                      {newsData.length === 0 ? "뉴스 데이터가 없습니다." : "검색 결과가 없습니다."}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {activeCategory === "blog" && (
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                }}
              >
                <h2 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#fff" }}>
                  <i className="fas fa-blog" style={{ marginRight: "10px", color: "#ff6b35" }}></i>
                  최신 블로그
                </h2>
              </div>

              {isLoadingContent ? (
                <div style={{
                  textAlign: "center",
                  padding: "100px 20px",
                  color: "#667eea",
                  fontSize: "1.2rem"
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: "3rem", marginBottom: "20px", display: "block" }}></i>
                  블로그 데이터를 불러오는 중...
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {filteredBlog.length > 0 ? (
                    filteredBlog.map((item, index) => (
                      <ContentCard key={index} item={item} />
                    ))
                  ) : (
                    <p style={{ color: "#6c757d", gridColumn: "1 / -1" }}>
                      {isLoadingContent ? "블로그 데이터를 불러오는 중..." : "검색 결과가 없습니다."}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {activeCategory === "paper" && (
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                }}
              >
                <h2 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#fff" }}>
                  <i className="fas fa-file-alt" style={{ marginRight: "10px", color: "#ff6b35" }}></i>
                  논문
                </h2>
              </div>

              {isLoadingPaper ? (
                <div style={{
                  textAlign: "center",
                  padding: "100px 20px",
                  color: "#667eea",
                  fontSize: "1.2rem"
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: "3rem", marginBottom: "20px", display: "block" }}></i>
                  논문 데이터를 불러오는 중...
                </div>
              ) : (
                <>

              {/* Keyword 필터 */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.9)",
                  marginBottom: "15px"
                }}>
                  키워드 선택
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <motion.button
                    onClick={() => setActiveKeyword("all")}
                    style={{
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "20px",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      background: activeKeyword === "all"
                        ? "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)"
                        : "#4a4a4a",
                      color: "#fff",
                      boxShadow: activeKeyword === "all"
                        ? "0 6px 15px rgba(255, 107, 53, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.3)",
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 8px 20px rgba(255, 107, 53, 0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    전체
                  </motion.button>
                  {paperKeywords.map((keyword) => (
                    <motion.button
                      key={keyword}
                      onClick={() => setActiveKeyword(keyword)}
                      style={{
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "20px",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        background: activeKeyword === keyword
                          ? "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)"
                          : "#4a4a4a",
                        color: "#fff",
                        boxShadow: activeKeyword === keyword
                          ? "0 6px 15px rgba(255, 107, 53, 0.4)"
                          : "0 2px 8px rgba(0, 0, 0, 0.3)",
                      }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 8px 20px rgba(255, 107, 53, 0.5)",
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {keyword}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 논문 목록 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                  marginBottom: "40px",
                }}
              >
                {currentPapers.length > 0 ? (
                  currentPapers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} variants={fadeUp} />
                  ))
                ) : (
                  <p style={{ color: "#6c757d", gridColumn: "1 / -1" }}>
                    {paperData.length === 0 ? "논문 데이터를 불러오는 중..." : "해당 키워드의 논문이 없습니다."}
                  </p>
                )}
              </div>

              {/* 페이지네이션 */}
              {filteredPapers.length > 0 && totalPaperPages > 1 && (
                <motion.div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "30px",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    {getPaperPageNumbers().map((page) => (
                      <motion.button
                        key={page}
                        onClick={() => setCurrentPaperPage(page)}
                        style={{
                          padding: "8px 14px",
                          border: currentPaperPage === page ? "2px solid #667eea" : "1px solid #dee2e6",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          fontWeight: currentPaperPage === page ? 700 : 500,
                          cursor: "pointer",
                          background: currentPaperPage === page ? "#667eea" : "#fff",
                          color: currentPaperPage === page ? "#fff" : "#495057",
                          transition: "all 0.2s ease",
                          minWidth: "40px",
                        }}
                        whileHover={{
                          scale: 1.05,
                          borderColor: "#667eea",
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {page}
                      </motion.button>
                    ))}

                    {currentPaperPage < totalPaperPages && (
                      <motion.button
                        onClick={() => setCurrentPaperPage(prev => Math.min(prev + 1, totalPaperPages))}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #dee2e6",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          background: "#fff",
                          color: "#667eea",
                          transition: "all 0.2s ease",
                        }}
                        whileHover={{
                          scale: 1.05,
                          borderColor: "#667eea",
                          background: "#f8f9fa",
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        다음 <i className="fas fa-chevron-right"></i>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
              </>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

// Content Card Component for News and Blog
function ContentCard({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRadius: "15px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        textDecoration: "none",
        display: "block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
        e.currentTarget.style.boxShadow = "0 15px 30px rgba(0, 0, 0, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
      }}
    >
      {/* Info */}
      <div style={{ padding: "20px" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#fff",
            margin: "0 0 12px",
            lineHeight: "1.5",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.title}
        </h3>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.9rem",
          color: "rgba(255, 255, 255, 0.7)",
        }}>
          <i className="fas fa-calendar-alt" style={{ color: "#ff6b35" }}></i>
          <span>{item.pubdate}</span>
        </div>
        <div style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}>
          <span style={{
            fontSize: "0.85rem",
            color: "#ff6b35",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            자세히 보기
            <i className="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    </a>
  );
}

// Paper Card Component for Research Papers
function PaperCard({ paper }) {
  return (
    <a
      href={paper.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRadius: "15px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        textDecoration: "none",
        display: "block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
        e.currentTarget.style.boxShadow = "0 15px 30px rgba(0, 0, 0, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
      }}
    >
      {/* Info */}
      <div style={{ padding: "20px" }}>
        {/* Keyword Badge */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}>
            {paper.keyword}
          </span>
        </div>

        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "#fff",
            margin: "0 0 12px",
            lineHeight: "1.5",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {paper.title}
        </h3>

        {/* Authors */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.85rem",
          color: "rgba(255, 255, 255, 0.7)",
          marginBottom: "8px",
        }}>
          <i className="fas fa-user" style={{ color: "#ff6b35" }}></i>
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>{paper.authors}</span>
        </div>

        {/* Journal & Year */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.85rem",
          color: "rgba(255, 255, 255, 0.7)",
          marginBottom: "8px",
        }}>
          <i className="fas fa-book" style={{ color: "#ff6b35" }}></i>
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>{paper.journal}</span>
        </div>

        {/* Year */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.85rem",
          color: "rgba(255, 255, 255, 0.7)",
        }}>
          <i className="fas fa-calendar-alt" style={{ color: "#ff6b35" }}></i>
          <span>{paper.year}</span>
        </div>

        <div style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}>
          <span style={{
            fontSize: "0.85rem",
            color: "#ff6b35",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            논문 보기
            <i className="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    </a>
  );
}

export default LibraryPage;
