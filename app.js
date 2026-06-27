// 보안 점검용 주석:
// 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있으므로, Gemini API 호출은 Vercel Serverless Function에서 처리합니다.
// 2. .env 파일은 절대 GitHub에 올리지 않습니다.
// 3. Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 합니다.
// 4. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보(익명화된 정보)로 제한합니다.

const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;
let selectedStudentForCounseling = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  selectedStudentForCounseling = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    <!-- AI 학생 상담 전략 도우미 섹션 -->
    <section id="counselingSection" class="counseling-panel" style="margin-top: 28px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); box-shadow: var(--shadow); padding: 28px;">
      <div>
        <p class="eyebrow">AI Helper</p>
        <h2 style="margin: 0 0 16px; font-size: 24px; color: var(--ink);">AI 학생 상담 전략 도우미</h2>
      </div>
      
      <div id="counselingContainer">
        <p style="color: var(--muted); margin: 0; line-height: 1.5;">
          상단 학생 카드에서 <strong>"상담 전략 요청"</strong> 버튼을 클릭하면, 해당 학생의 학습 데이터와 교사의 고민을 바탕으로 AI가 구체적인 상담 전략을 제안합니다.
        </p>
      </div>
    </section>
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");

  // 버튼 이벤트 리스너 바인딩
  const reqButtons = adminView.querySelectorAll(".counseling-request-btn");
  reqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const studentId = btn.getAttribute("data-student-id");
      const student = STUDENTS.find((s) => s.id === studentId);
      if (student) {
        selectStudentForCounseling(student);
      }
    });
  });
}

function getStudentAlias(student) {
  const index = STUDENTS.findIndex((s) => s.id === student.id);
  const aliasLetter = String.fromCharCode(65 + (index >= 0 ? index : 0));
  return `학생 ${aliasLetter}`;
}

function selectStudentForCounseling(student) {
  selectedStudentForCounseling = student;
  const alias = getStudentAlias(student);
  const gradeSummary = Object.entries(student.grades).map(([k, v]) => `${k}(${v})`).join(", ");
  const learningTraits = student.traits.join(" ") + " " + student.teacherMemo;

  const container = document.querySelector("#counselingContainer");
  container.innerHTML = `
    <div class="counseling-details" style="display: grid; gap: 20px;">
      <!-- 학생 정보 표시 영역 (화면용 & 익명화 구분) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 16px;">
        <div>
          <h4 style="margin: 0 0 8px; color: var(--ink); font-size: 15px; font-weight: 600;">[화면용 학생 정보]</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>이름:</strong> <span>${student.name}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>학번:</strong> <span>${student.id}</span></p>
        </div>
        <div>
          <h4 style="margin: 0 0 8px; color: var(--ink); font-size: 15px; font-weight: 600;">[Gemini 전송용 익명화 정보]</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>대체 식별자:</strong> <span>${alias}</span></p>
          <p style="margin: 4px 0; font-size: 12px; color: var(--muted);">(※ 개인정보 보호를 위해 실제 이름, 학번, 사진은 전송 정보에서 제외됩니다.)</p>
        </div>
      </div>

      <!-- 교사 고민 입력 -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label for="teacherConcernInput" style="font-weight: 600; font-size: 14px; color: var(--ink);">교사 상담 고민 입력</label>
        <textarea id="teacherConcernInput" rows="3" style="width: 100%; border: 1px solid var(--line); border-radius: 6px; padding: 12px; font-family: inherit; font-size: 14px; resize: vertical;" placeholder="예: 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?"></textarea>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
          <button class="ghost-button placeholder-suggestion-btn" style="min-height: 32px; font-size: 12px; padding: 0 10px;" type="button">수업 참여는 좋은데 평가 결과가 낮습니다.</button>
          <button class="ghost-button placeholder-suggestion-btn" style="min-height: 32px; font-size: 12px; padding: 0 10px;" type="button">과제 제출이 자주 늦습니다.</button>
          <button class="ghost-button placeholder-suggestion-btn" style="min-height: 32px; font-size: 12px; padding: 0 10px;" type="button">친구들과 협업할 때 소극적입니다.</button>
        </div>
      </div>

      <!-- 전송 데이터 미리보기 -->
      <div>
        <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--ink);">전송 데이터 미리보기</h4>
        <pre id="dataPreview" style="background: var(--surface-strong); border: 1px solid var(--line); border-radius: 6px; padding: 12px; font-family: monospace; font-size: 13px; margin: 0; overflow-x: auto; white-space: pre-wrap; word-break: break-all;"></pre>
      </div>

      <!-- 전송 버튼 및 상태 표시 -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <button id="sendCounselingBtn" class="primary-button" type="button">AI 상담 전략 받기</button>
        <div id="counselingStatus" style="font-weight: 500; color: var(--primary); font-size: 14px;"></div>
      </div>

      <!-- 오류 메시지 표시 영역 -->
      <div id="counselingError" class="form-message" style="margin: 0; display: none; color: var(--danger); font-weight: 500;" role="alert"></div>

      <!-- Gemini 응답 결과 표시 영역 -->
      <div id="counselingResultContainer" style="display: none; border-top: 1px solid var(--line); padding-top: 16px;">
        <h4 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: var(--primary);">AI 상담 전략 제안</h4>
        <div id="counselingResult" style="background: var(--surface-strong); border: 1px solid var(--line); border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: var(--ink);"></div>
      </div>

      <!-- 하단 안내 문구 -->
      <p style="margin: 12px 0 0; font-size: 12px; color: var(--muted); border-top: 1px dashed var(--line); padding-top: 12px; line-height: 1.5;">
        ※ AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.
      </p>
    </div>
  `;

  const textarea = container.querySelector("#teacherConcernInput");
  const preview = container.querySelector("#dataPreview");
  const sendBtn = container.querySelector("#sendCounselingBtn");
  const statusDiv = container.querySelector("#counselingStatus");
  const errorDiv = container.querySelector("#counselingError");
  const resultContainer = container.querySelector("#counselingResultContainer");
  const resultDiv = container.querySelector("#counselingResult");

  // 미리보기 업데이트 함수
  function updatePreview() {
    const previewData = {
      studentAlias: alias,
      gradeSummary: gradeSummary,
      learningTraits: learningTraits,
      teacherConcern: textarea.value.trim(),
    };
    preview.textContent = JSON.stringify(previewData, null, 2);
  }

  // 실시간 입력 반영
  textarea.addEventListener("input", updatePreview);
  updatePreview();

  // 예시 플레이스홀더 제안 버튼 처리
  const suggestionBtns = container.querySelectorAll(".placeholder-suggestion-btn");
  suggestionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.textContent;
      let fullText = "";
      if (text.includes("수업 참여는 좋은데")) {
        fullText = "수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?";
      } else if (text.includes("과제 제출이 자주")) {
        fullText = "과제 제출이 자주 늦습니다. 혼내기보다는 원인을 파악하고 싶은데 어떻게 접근하면 좋을까요?";
      } else if (text.includes("친구들과 협업할 때")) {
        fullText = "친구들과 협업할 때 소극적인 편입니다. 어떤 질문으로 대화를 시작하면 좋을까요?";
      }
      textarea.value = fullText;
      updatePreview();
      textarea.focus();
    });
  });

  // 상담 전략 요청 API 전송
  sendBtn.addEventListener("click", async () => {
    const concernText = textarea.value.trim();
    errorDiv.style.display = "none";
    errorDiv.textContent = "";

    if (!concernText) {
      errorDiv.textContent = "상담 고민을 먼저 입력해주세요.";
      errorDiv.style.display = "block";
      return;
    }

    try {
      sendBtn.disabled = true;
      statusDiv.textContent = "AI가 상담 전략을 생성하는 중입니다.";
      resultContainer.style.display = "none";

      const res = await fetch("/api/gemini-counseling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentAlias: alias,
          gradeSummary: gradeSummary,
          learningTraits: learningTraits,
          teacherConcern: concernText,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "응답 처리 실패");
      }

      resultDiv.textContent = data.result;
      resultContainer.style.display = "block";
      // 스크롤 이동
      resultContainer.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error(err);
      errorDiv.textContent = "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
      errorDiv.style.display = "block";
    } finally {
      sendBtn.disabled = false;
      statusDiv.textContent = "";
    }
  });

  // 섹션 영역으로 자동 스크롤
  document.querySelector("#counselingSection").scrollIntoView({ behavior: "smooth" });
}

function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <div style="margin-top: 18px; display: flex; justify-content: flex-end;">
          <button class="primary-button counseling-request-btn" data-student-id="${student.id}" type="button">상담 전략 요청</button>
        </div>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

showOnly(loginView);
