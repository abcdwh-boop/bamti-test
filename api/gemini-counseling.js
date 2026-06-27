// 보안 점검용 주석:
// 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있으므로, Gemini API 호출은 Vercel Serverless Function에서 처리합니다.
// 2. .env 파일은 절대 GitHub에 올리지 않습니다.
// 3. Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 합니다.
// 4. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보(익명화된 정보)로 제한합니다.

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(451).json({ success: false, error: 'Method Not Allowed. Only POST is supported.' });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body || {};

  // 필수 값 검증
  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({
      success: false,
      error: '필수 요청 본문(studentAlias, gradeSummary, learningTraits, teacherConcern)이 누락되었습니다.'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.'
    });
  }

  const promptText = `
당신은 노련하고 공감 능력이 뛰어난 전문 교육 상담사 및 교사 멘토입니다.
교사가 제공한 아래 익명화된 학생의 데이터와 교사의 상담 고민을 바탕으로 학생 상담 전략을 제안해주세요.

[학생 정보 (익명화)]
- 학생 식별자: ${studentAlias}
- 성적 및 학습 현황 요약: ${gradeSummary}
- 학습 특성 및 행동 패턴: ${learningTraits}

[교사의 상담 고민]
${teacherConcern}

[상담 전략 작성 가이드라인]
1. 학생을 단정적으로 판단하거나 진단하지 마세요. (예: "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다" 등 단정적이거나 낙인찍는 표현 금지)
2. 교사가 학생을 깊이 이해하고 신뢰 관계를 쌓으며 따뜻하게 대화할 수 있도록 돕는 방향으로 제안하세요.
3. 제안하는 상담 전략은 참고용이며, 최종 판단은 교사가 학생의 상황을 종합적으로 고려하여 결정해야 한다는 점을 마지막 안내 문구로 포함하세요.

[답변 형식]
반드시 다음 구조로 명확하게 답변해 주세요:

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/Gemini 3.1 Flash Lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Gemini API 호출에 실패했습니다: ${errorText}`
      });
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      success: true,
      result: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `서버 오류 발생: ${error.message}`
    });
  }
}
