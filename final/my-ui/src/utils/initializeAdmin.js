// 초기 관리자 계정 생성 함수
export const initializeAdminUser = () => {
  const users = localStorage.getItem("registeredUsers");
  const usersList = users ? JSON.parse(users) : [];

  // 이미 admin 계정이 있는지 확인
  const adminExists = usersList.some((u) => u.username === "admin");

  if (!adminExists) {
    // 관리자 계정 생성
    const adminUser = {
      username: "admin",
      email: "admin@assemble.com",
      password: "admin123", // 실제 운영 환경에서는 안전한 비밀번호 사용 및 암호화 필요
      status: "approved",
      role: "admin",
      registeredAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "system",
    };

    usersList.push(adminUser);
    localStorage.setItem("registeredUsers", JSON.stringify(usersList));
    console.log("✅ 관리자 계정이 생성되었습니다.");
    console.log("Username: admin");
    console.log("Password: admin123");
  }
};
