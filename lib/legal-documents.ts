import type { Locale } from "@/lib/constants";

export const LEGAL_SLUGS = ["terms", "privacy", "cookies"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

type LegalTable = {
  headers: string[];
  rows: string[][];
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  table?: LegalTable;
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
};

export type LegalUi = {
  contents: string;
  effectiveDate: string;
  version: string;
  operator: string;
  privacyDepartment: string;
  contactChannel: string;
  contactAction: string;
  documentNavigation: string;
  importantNotice: string;
};

const ko: Record<LegalSlug, LegalDocument> = {
  terms: {
    eyebrow: "B2BB2G LEGAL",
    title: "이용약관",
    summary:
      "B2BB2G 마켓플레이스의 가입, 게시, 문의, 거래 및 서비스 이용에 관한 기본 조건을 정합니다.",
    sections: [
      {
        id: "purpose",
        title: "제1조 목적",
        paragraphs: [
          "이 약관은 B2BB2G가 제공하는 B2B·B2G 온라인 마켓플레이스 및 이에 부수하는 서비스의 이용 조건과 절차, 회사와 회원의 권리·의무 및 책임사항을 정함을 목적으로 합니다.",
        ],
      },
      {
        id: "definitions",
        title: "제2조 용어의 정의",
        items: [
          "“서비스”란 상품·프로젝트·구매요청·행사·네트워크 게시물의 등록과 열람, 회원 간 문의, 배지 및 멤버십 등 B2BB2G가 제공하는 기능을 말합니다.",
          "“회원”이란 이메일 인증과 가입 절차를 완료하고 계정을 부여받은 개인 또는 사업자 소속 이용자를 말합니다.",
          "“게시물”이란 회원 또는 운영자가 서비스에 등록하는 문구, 이미지, 영상 링크, 첨부파일, 상품 정보, 요청 정보 및 댓글을 말합니다.",
          "“거래 당사자”란 서비스를 통해 재화 또는 용역의 공급·구매를 협의하거나 계약하는 회원을 말합니다.",
          "“신뢰 배지”란 제출 자료와 운영 기준에 따라 회원의 일정 자격 또는 상태를 표시하는 표지를 말합니다.",
        ],
      },
      {
        id: "effect",
        title: "제3조 약관의 게시, 효력 및 변경",
        paragraphs: [
          "이 약관은 서비스 화면에 게시하거나 연결하여 회원이 쉽게 확인할 수 있도록 하며, 회원이 가입 또는 이용 절차에서 동의한 때부터 효력이 발생합니다.",
          "회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다. 일반적인 변경은 시행일 7일 전부터, 회원에게 불리하거나 중요한 변경은 시행일 30일 전부터 변경 내용과 사유를 서비스에 공지하고 가능한 경우 이메일 또는 알림으로 안내합니다.",
          "회원이 변경 약관에 동의하지 않는 경우 시행일 전까지 이용계약을 해지할 수 있습니다. 강행 법규에서 별도로 정한 사항은 그 규정이 우선합니다.",
        ],
      },
      {
        id: "account",
        title: "제4조 가입과 계정 관리",
        items: [
          "가입은 회사가 정한 방식에 따라 이메일 인증, 초대 또는 추천 링크 확인, 필수 정보 입력 및 약관 동의를 완료하여 신청합니다.",
          "회원은 본인 또는 소속 조직을 대표하여 가입하고 서비스를 이용할 적법한 권한이 있어야 하며, 등록 정보가 변경되면 지체 없이 수정해야 합니다.",
          "계정과 인증 수단은 회원 본인만 사용할 수 있습니다. 도용 또는 무단 사용을 알게 된 경우 즉시 비밀번호를 변경하고 운영팀에 알려야 합니다.",
          "허위 정보, 타인 명의, 중복·자동화 가입, 제재 회피 목적의 가입 또는 법령상 이용이 제한되는 경우 승인이 거절되거나 계정이 제한될 수 있습니다.",
        ],
      },
      {
        id: "service",
        title: "제5조 서비스의 내용과 변경",
        paragraphs: [
          "회사는 상품 및 역량 소개, 구매요청, 행사·공지, 회원 프로필과 네트워크 피드, 문의 전달, 배지·멤버십, 알림과 관리 기능을 제공합니다.",
          "서비스의 구체적인 기능, 운영 기준, 이용 가능 범위는 화면 안내와 운영 정책에 따릅니다. 기능 개선, 보안, 법령 준수 또는 운영상 필요한 경우 서비스의 전부 또는 일부가 변경될 수 있으며 중요한 변경은 사전에 안내합니다.",
        ],
      },
      {
        id: "member-duty",
        title: "제6조 회원의 의무와 금지행위",
        items: [
          "회원은 관련 법령, 이 약관, 서비스 안내 및 거래 상대방과의 합의를 준수해야 합니다.",
          "허위·과장 정보, 권리 침해 자료, 불법 상품, 악성코드, 스팸, 차별·괴롭힘, 부정한 리뷰 또는 플랫폼의 정상 운영을 방해하는 내용을 등록해서는 안 됩니다.",
          "서비스의 보안 기능을 우회하거나 데이터를 무단 수집·복제·역설계하고, 자동화 수단으로 비정상적인 요청을 보내거나 타인의 계정·개인정보를 침해해서는 안 됩니다.",
          "게시물이나 문의에 결제정보, 비밀번호, 인증번호 또는 거래에 불필요한 민감정보를 포함해서는 안 됩니다.",
        ],
      },
      {
        id: "content",
        title: "제7조 게시물과 지식재산권",
        paragraphs: [
          "회원은 자신이 등록하는 게시물의 정확성, 적법성, 최신성 및 제3자 권리 침해 여부에 책임을 집니다. 상품 사양, 인증, 원산지, 가격, 납기, 수량과 거래 조건은 실제 제공 가능한 내용이어야 합니다.",
          "게시물의 권리는 원칙적으로 작성자에게 귀속됩니다. 회원은 서비스 운영, 검색·공유 미리보기, 홍보 및 접근성 제공에 필요한 범위에서 회사가 게시물을 저장·복제·표시·형식 변환할 수 있는 비독점적 이용 권한을 부여합니다.",
          "회사는 위법하거나 권리를 침해하고, 신고가 접수되거나 운영 기준에 위반되는 게시물을 검토·숨김·삭제하거나 수정을 요청할 수 있습니다.",
        ],
      },
      {
        id: "communication",
        title: "제8조 문의, 메시지 및 운영 검토",
        paragraphs: [
          "회원 간 초기 비즈니스 연락은 서비스의 문의 기능을 통해 이루어집니다. 문의와 답변은 해당 게시물에 연결되어 기록될 수 있습니다.",
          "스팸·사기·불법 거래 방지, 품질 관리, 분쟁 대응 및 안전한 전달을 위해 운영팀이 문의와 메시지의 내용 및 첨부자료를 열람·검토할 수 있습니다. 검토 결과에 따라 전달이 보류되거나 반려될 수 있으며, 필요한 경우 사유를 안내합니다.",
          "회원은 영업비밀이나 기밀정보를 전달하기 전에 상대방과 별도의 비밀유지 조건을 확인해야 합니다. 서비스의 검토 기능 자체가 비밀유지계약을 의미하지는 않습니다.",
        ],
      },
      {
        id: "badges",
        title: "제9조 신뢰 배지와 멤버십",
        paragraphs: [
          "신뢰 배지와 멤버십은 제출 정보, 증빙자료, 결제 또는 운영 기준을 확인한 뒤 부여됩니다. 배지는 특정 시점의 확인 결과를 나타낼 뿐 상품의 품질, 거래 이행, 신용도 또는 정부·공공기관의 보증을 의미하지 않습니다.",
          "자격 요건이 충족되지 않거나 자료가 허위·변조된 경우, 유효기간이 만료되거나 운영 정책을 위반한 경우 배지 또는 멤버십 혜택이 정지·회수될 수 있습니다.",
          "유료 기능의 가격, 기간, 제공 범위, 결제 및 환불 조건은 신청 화면 또는 별도 안내에서 확인할 수 있으며, 관련 법령의 강행 규정이 우선 적용됩니다.",
        ],
      },
      {
        id: "transactions",
        title: "제10조 거래와 마켓플레이스의 역할",
        paragraphs: [
          "B2BB2G는 거래 당사자가 상품·용역·프로젝트 정보를 탐색하고 협의할 수 있도록 온라인 장소와 도구를 제공하는 중개 플랫폼입니다. 별도로 명시하지 않는 한 회사는 회원 간 거래의 판매자, 구매자, 계약 당사자 또는 대리인이 아닙니다.",
          "거래의 가격, 규격, 수량, 검사, 인증, 대금, 납기, 배송, 통관, 수출입 허가, 세금, 하자·보증 및 계약 이행은 거래 당사자가 직접 확인하고 합의해야 합니다.",
          "회원은 거래 전 상대방의 권한과 신뢰 배지, 기업 정보, 견본·검사 결과 및 필요한 인허가를 스스로 검토해야 합니다. 회사는 거래 성사, 상품의 품질·적합성, 대금 회수 또는 계약 이행을 보증하지 않습니다.",
        ],
      },
      {
        id: "suspension",
        title: "제11조 이용 제한과 계약 해지",
        paragraphs: [
          "회원이 법령 또는 약관을 위반하거나 서비스의 신뢰·안전을 해치는 경우 회사는 사안의 정도에 따라 게시물 제한, 기능 정지, 계정 일시 중지 또는 이용계약 해지를 할 수 있습니다. 긴급한 보안·법적 위험이 없는 경우 사유와 이의제기 방법을 안내합니다.",
          "회원은 대시보드에서 탈퇴를 요청할 수 있습니다. 탈퇴 시 공개 프로필과 연락처는 비식별 처리되며, 게시물·문의·거래 관련 기록은 서비스 연속성, 부정 이용 방지, 분쟁 대응 또는 법령상 보관 의무 범위에서 익명화하거나 제한적으로 보관될 수 있습니다.",
        ],
      },
      {
        id: "availability",
        title: "제12조 서비스 중단",
        paragraphs: [
          "회사는 점검, 설비 장애, 통신 두절, 보안 사고, 천재지변, 법령·행정명령 또는 외부 서비스 장애로 서비스의 전부 또는 일부를 일시 중단할 수 있습니다. 예정된 중단은 가능한 한 사전에 알리고, 긴급한 경우 사후에 안내할 수 있습니다.",
        ],
      },
      {
        id: "liability",
        title: "제13조 책임의 제한",
        paragraphs: [
          "회사는 회원이 제공한 정보, 거래 당사자 간 협의·계약, 외부 링크 또는 회원의 귀책사유로 발생한 손해에 대해 회사의 고의 또는 과실이 없는 한 책임을 부담하지 않습니다.",
          "회사의 고의 또는 중대한 과실, 개인정보 보호 의무 위반 등 관련 법령상 책임을 배제할 수 없는 경우에는 이 조의 책임 제한이 적용되지 않습니다. 회원의 손해가 특별한 사정으로 인한 경우 회사가 그 사정을 알았거나 알 수 있었을 때에만 관련 법령에 따라 책임을 부담합니다.",
        ],
      },
      {
        id: "notices",
        title: "제14조 통지",
        paragraphs: [
          "회사는 회원이 등록한 이메일, 서비스 알림 또는 공지사항을 통해 통지할 수 있습니다. 다수 회원에게 공통으로 적용되는 사항은 서비스에 7일 이상 게시하는 방식으로 개별 통지를 갈음할 수 있으나, 회원의 권리·의무에 중대한 영향을 주는 사항은 가능한 범위에서 개별 안내합니다.",
        ],
      },
      {
        id: "disputes",
        title: "제15조 준거법과 분쟁 해결",
        paragraphs: [
          "이 약관과 서비스 이용 관계에는 대한민국 법령을 적용합니다. 회사와 회원은 분쟁이 발생한 경우 상호 협의하여 해결하도록 노력하며, 해결되지 않는 경우 민사소송법 등 관계 법령에 따른 관할 법원에서 해결합니다.",
        ],
      },
      {
        id: "effective",
        title: "부칙",
        paragraphs: ["이 약관은 표시된 시행일부터 적용합니다."],
      },
    ],
  },
  privacy: {
    eyebrow: "B2BB2G PRIVACY",
    title: "개인정보처리방침",
    summary:
      "B2BB2G가 어떤 개인정보를 왜 수집하고, 어떻게 이용·보관·보호하는지 안내합니다.",
    sections: [
      {
        id: "overview",
        title: "1. 개인정보 처리방침의 목적",
        paragraphs: [
          "B2BB2G는 개인정보 보호법 등 관계 법령을 준수하며, 정보주체의 개인정보를 적법하고 안전하게 처리합니다. 이 방침은 서비스에서 처리하는 개인정보의 항목, 목적, 보유기간, 제공·위탁, 파기 및 정보주체의 권리를 설명합니다.",
        ],
      },
      {
        id: "collection",
        title: "2. 처리하는 개인정보 항목과 수집 방법",
        table: {
          headers: ["구분", "처리 항목", "수집 방법"],
          rows: [
            ["가입·인증", "이메일 주소, 인증정보, 가입 경로, 초대·추천 정보", "회원이 가입 화면에 입력하거나 인증 과정에서 자동 생성"],
            ["회원 프로필", "UID, 회사명, 담당자명, 소개, 프로필 사진, 연락처", "회원이 프로필 및 연락처 화면에 입력"],
            ["서비스 이용", "게시물, 이미지·파일·영상 링크, 문의·답변·댓글, 배지 신청 및 증빙자료", "회원이 기능 이용 과정에서 제출"],
            ["보안·접속", "IP 주소 또는 마스킹 값, 접속 시각, 브라우저·기기 정보, 로그인·보안 이벤트, 쿠키", "서비스 이용 과정에서 자동 생성"],
            ["유료 서비스", "신청 내역, 결제 확인에 필요한 정보와 처리 기록", "회원 제출 또는 결제·운영 확인 과정"],
          ],
        },
      },
      {
        id: "purpose",
        title: "3. 개인정보의 처리 목적",
        items: [
          "회원 식별, 이메일 인증, 초대 기반 가입, 로그인과 계정 보안",
          "프로필·상품·프로젝트·구매요청·행사·네트워크 피드 제공",
          "회원 간 문의 전달, 메시지 검토, 알림 및 고객 지원",
          "신뢰 배지·멤버십 신청 확인, 부정 이용 방지 및 운영 정책 집행",
          "서비스 안정성 확보, 접속 기록 분석, 장애·보안 사고 대응",
          "법적 의무 이행, 민원·분쟁 처리 및 권리 침해 대응",
        ],
      },
      {
        id: "retention",
        title: "4. 개인정보의 처리 및 보유기간",
        paragraphs: [
          "개인정보는 처리 목적 달성 시 지체 없이 파기합니다. 다만 관계 법령에 따른 보존 의무, 분쟁 처리 또는 부정 이용 방지를 위해 필요한 경우에는 해당 기간 동안 접근을 제한하여 보관합니다.",
        ],
        table: {
          headers: ["정보 또는 기록", "보유기간"],
          rows: [
            ["계정·프로필·연락처", "회원 탈퇴 또는 이용계약 종료 시까지. 탈퇴 후 공개 정보는 비식별 처리하며 인증·분쟁 대응에 필요한 최소 정보는 최대 3년"],
            ["게시물·문의·메시지", "서비스 제공 기간. 탈퇴 후에는 작성자 식별정보를 제거하고 서비스 연속성·분쟁 대응에 필요한 범위에서 보관"],
            ["초대·추천 기록", "초대 만료·철회·사용 후 부정 이용 및 분쟁 대응을 위해 최대 3년"],
            ["배지·멤버십 신청 및 증빙", "자격 확인 기간과 종료 후 분쟁 대응을 위해 최대 3년. 법령상 별도 의무가 있으면 해당 기간"],
            ["로그인·보안 기록", "운영 설정에 따른 기간. 현재 기본 90일, 보안 사고 조사 중인 기록은 조사 종료 시까지"],
            ["표시·광고 기록", "전자상거래 관련 법령이 적용되는 경우 6개월"],
            ["계약·청약철회, 대금결제·공급 기록", "전자상거래 관련 법령이 적용되는 경우 5년"],
            ["소비자 불만·분쟁 처리 기록", "전자상거래 관련 법령이 적용되는 경우 3년"],
          ],
        },
      },
      {
        id: "third-parties",
        title: "5. 개인정보의 제3자 제공",
        paragraphs: [
          "B2BB2G는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다. 다만 정보주체가 사전에 동의한 경우, 법령에 특별한 규정이 있는 경우 또는 급박한 생명·신체·재산의 이익을 위해 필요한 경우에는 관계 법령에 따라 제공할 수 있습니다.",
          "추천 코디네이터를 통한 가입에서 운영 지원이 필요한 경우, 서비스 설정과 접근 권한에 따라 해당 코디네이터가 추천 회원의 등록 연락처 또는 문의 현황을 확인할 수 있습니다. 적용 대상과 범위는 가입 또는 기능 이용 시 안내하며, 회원은 운영팀에 접근 중지를 요청할 수 있습니다.",
        ],
      },
      {
        id: "processors",
        title: "6. 개인정보 처리업무의 위탁",
        table: {
          headers: ["수탁자", "위탁 업무"],
          rows: [
            ["Supabase, Inc.", "데이터베이스, 회원 인증, 파일 저장소 및 서버 인프라 운영"],
            ["Resend, Inc.", "회원 인증 및 서비스 알림 이메일 발송과 발송 상태 관리"],
            ["Intuition Machines, Inc. (hCaptcha)", "자동화된 가입·로그인 시도 탐지와 서비스 보안"],
          ],
        },
        paragraphs: [
          "B2BB2G는 위탁계약과 서비스 설정을 통해 목적 외 처리 금지, 안전성 확보, 재위탁 관리, 사고 대응 및 종료 후 파기 등 개인정보 보호에 필요한 사항을 관리합니다.",
        ],
      },
      {
        id: "overseas",
        title: "7. 개인정보의 국외 처리",
        paragraphs: [
          "글로벌 클라우드·이메일·보안 서비스를 이용하는 과정에서 아래 정보가 국외에서 처리될 수 있습니다. 전송은 암호화된 네트워크를 통해 서비스 이용 또는 이메일 발송·보안 검증 시 이루어집니다.",
          "국외 처리에 동의하지 않는 경우 선택 기능은 거부할 수 있으나, 인증 이메일이나 보안 검증처럼 서비스 제공에 필수적인 처리를 거부하면 가입·로그인 또는 일부 기능 이용이 제한될 수 있습니다. 관련 요청은 아래 개인정보 보호 담당부서로 접수할 수 있습니다.",
        ],
        table: {
          headers: ["이전받는 자·국가", "항목과 목적", "보유·이용기간"],
          rows: [
            ["Supabase, Inc. / 프로젝트 지정 리전(대한민국)", "계정, 프로필, 게시물, 문의, 파일의 저장·인증·서비스 제공", "서비스 계약 또는 회원 데이터 삭제 시까지"],
            ["Resend, Inc. / 미국", "이메일 주소, 알림 제목·내용, 발송 메타데이터의 이메일 전송", "발송 및 오류 처리에 필요한 기간과 수탁자 정책상 보관기간"],
            ["Intuition Machines, Inc. / 미국 및 분산 처리 인프라", "IP·브라우저·기기 신호와 보안 검증 결과의 자동화 공격 방지", "실시간 검증과 보안 목적 달성에 필요한 기간"],
          ],
        },
      },
      {
        id: "destruction",
        title: "8. 개인정보의 파기 절차와 방법",
        items: [
          "보유기간이 지나거나 목적이 달성된 개인정보는 별도 보관이 필요한 정보와 분리한 뒤 지체 없이 파기합니다.",
          "전자적 파일은 복구 또는 재생이 어렵도록 안전한 방법으로 삭제하고, 종이 문서는 분쇄하거나 소각합니다.",
          "탈퇴 시 공개 프로필과 연락처는 비식별 처리하며, 법령상 보관 대상은 별도 권한과 기간을 적용한 후 파기합니다.",
        ],
      },
      {
        id: "rights",
        title: "9. 정보주체의 권리와 행사 방법",
        paragraphs: [
          "정보주체는 자신의 개인정보에 대해 열람, 정정·삭제, 처리정지, 동의 철회 및 회원 탈퇴를 요청할 수 있습니다. 프로필·보안 설정에서 직접 처리하거나 서비스 내 문의함을 통해 운영팀에 요청할 수 있습니다.",
          "대리인이 요청하는 경우 위임장 등 정당한 대리 권한을 확인할 수 있습니다. 다른 사람의 권리 또는 법령상 의무에 영향을 주는 경우에는 요청이 제한될 수 있으며 그 사유를 안내합니다.",
        ],
      },
      {
        id: "children",
        title: "10. 아동의 개인정보",
        paragraphs: [
          "B2BB2G는 사업 목적의 회원 서비스를 제공하며 만 14세 미만 아동의 회원가입을 허용하지 않습니다. 만 14세 미만 아동의 정보가 확인되면 법정대리인 확인 등 관계 법령에 따라 필요한 조치를 취합니다.",
        ],
      },
      {
        id: "security",
        title: "11. 개인정보의 안전성 확보조치",
        items: [
          "개인정보 접근 권한의 최소화와 역할별 통제, 관리자 다중인증 및 접근 기록 관리",
          "전송 구간 암호화, 비밀번호의 안전한 인증 서비스 처리, 중요 정보의 접근 제한",
          "보안 이벤트·의심 로그인 탐지, 취약점 점검, 백업과 장애 대응 절차",
          "직원·수탁자에 대한 개인정보 보호 의무와 사고 대응 체계 운영",
        ],
      },
      {
        id: "cookies",
        title: "12. 쿠키와 자동 수집 장치",
        paragraphs: [
          "서비스는 로그인 유지, 언어·동의 설정 저장, 보안 및 이용환경 개선을 위해 쿠키와 유사 기술을 사용합니다. 필수 쿠키는 서비스 제공에 필요하며, 분석 쿠키는 동의한 경우에만 사용합니다.",
          "이용자는 쿠키 설정 페이지 또는 브라우저 설정에서 선택 쿠키를 거부하거나 저장된 쿠키를 삭제할 수 있습니다. 자세한 내용은 쿠키 정책에서 확인할 수 있습니다.",
        ],
      },
      {
        id: "contact",
        title: "13. 개인정보 보호 담당부서",
        paragraphs: [
          "개인정보 처리에 관한 문의, 권리 행사, 불만 또는 피해 구제 요청은 B2BB2G 운영팀에 접수할 수 있습니다. 접수 경로는 서비스 내 문의함이며, 접수된 요청은 본인 확인 후 관계 법령에 따라 처리합니다.",
        ],
      },
      {
        id: "remedies",
        title: "14. 권익침해 구제 방법",
        items: [
          "개인정보침해 신고센터: 국번 없이 118 (privacy.kisa.or.kr)",
          "개인정보분쟁조정위원회: 1833-6972 (kopico.go.kr)",
          "대검찰청 사이버수사과: 국번 없이 1301 (spo.go.kr)",
          "경찰청 사이버범죄 신고시스템: 국번 없이 182 (ecrm.police.go.kr)",
        ],
      },
      {
        id: "changes",
        title: "15. 개인정보처리방침의 변경",
        paragraphs: [
          "이 방침이 변경되는 경우 시행일과 변경 사유를 서비스에 공지합니다. 정보주체의 권리에 중대한 영향을 미치는 변경은 시행일 30일 전부터 안내하며, 그 밖의 변경은 원칙적으로 7일 전부터 안내합니다.",
        ],
      },
    ],
  },
  cookies: {
    eyebrow: "B2BB2G COOKIE POLICY",
    title: "쿠키 정책",
    summary:
      "B2BB2G가 사용하는 쿠키의 종류와 목적, 보관 기준 및 이용자가 선택을 변경하는 방법을 설명합니다.",
    sections: [
      {
        id: "definition",
        title: "1. 쿠키란 무엇인가요?",
        paragraphs: [
          "쿠키는 웹사이트가 브라우저에 저장하는 작은 데이터입니다. 로그인 상태를 유지하고 언어·개인정보 선택을 기억하며, 보안 기능과 안정적인 화면 이동을 제공하는 데 사용됩니다. 로컬 스토리지 등 유사 기술도 이 정책에서 쿠키와 함께 설명합니다.",
        ],
      },
      {
        id: "categories",
        title: "2. 사용하는 쿠키의 종류",
        table: {
          headers: ["구분", "목적", "일반적인 보관기간"],
          rows: [
            ["필수 쿠키", "로그인 세션, 보안 토큰, 언어, 쿠키 동의, 화면·앱 필수 상태 저장", "세션 종료 시 또는 설정된 만료일까지"],
            ["보안 쿠키·신호", "hCaptcha를 통한 자동화 공격, 비정상 가입·로그인 및 서비스 남용 방지", "실시간 검증과 보안 목적에 필요한 기간"],
            ["분석 쿠키", "방문·기능 이용 현황을 집계하여 성능과 사용성을 개선", "동의 후 설정되며 도구별 만료일까지"],
            ["외부 콘텐츠 저장소", "개인정보 보호 모드의 영상 등 외부 콘텐츠를 재생할 때 이용자 선택과 재생 상태 처리", "외부 제공자 정책 또는 브라우저 설정에 따름"],
          ],
        },
      },
      {
        id: "essential",
        title: "3. 필수 쿠키",
        paragraphs: [
          "필수 쿠키는 계정 인증, 보안, 언어, 쿠키 선택 저장과 같이 서비스가 정상적으로 작동하는 데 필요합니다. 이 쿠키는 서비스 제공을 위해 항상 활성화되며, 브라우저에서 차단하면 로그인이나 일부 기능이 동작하지 않을 수 있습니다.",
        ],
      },
      {
        id: "analytics",
        title: "4. 선택 쿠키와 동의",
        paragraphs: [
          "B2BB2G는 현재 필수 쿠키를 중심으로 운영합니다. 분석 도구를 사용하는 경우에는 이용자의 동의를 받은 뒤 선택 쿠키를 설정하며, 동의하지 않아도 필수 기능은 이용할 수 있습니다.",
          "아래 설정에서 분석 쿠키 허용 여부를 언제든 변경할 수 있습니다. 동의 변경은 이후 처리부터 적용되며, 이미 저장된 제3자 쿠키는 브라우저에서 별도로 삭제해야 할 수 있습니다.",
        ],
      },
      {
        id: "controls",
        title: "5. 브라우저에서 쿠키를 관리하는 방법",
        items: [
          "Chrome: 설정 → 개인정보 및 보안 → 서드 파티 쿠키",
          "Safari: 설정 → 개인정보 보호 → 웹사이트 데이터 관리",
          "Microsoft Edge: 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터",
          "Firefox: 설정 → 개인정보 및 보안 → 쿠키 및 사이트 데이터",
        ],
      },
      {
        id: "third-party",
        title: "6. 제3자 서비스",
        paragraphs: [
          "로그인·가입 보안을 위한 hCaptcha와 영상 등 외부 콘텐츠가 사용되는 경우 해당 제공자가 쿠키 또는 유사 기술을 사용할 수 있습니다. 제3자 처리에 관한 자세한 내용은 개인정보처리방침과 각 제공자의 정책에서 확인할 수 있습니다.",
        ],
      },
      {
        id: "contact",
        title: "7. 문의와 정책 변경",
        paragraphs: [
          "쿠키 사용에 관한 문의는 서비스 내 문의함을 통해 B2BB2G 운영팀에 접수할 수 있습니다. 쿠키의 종류나 목적이 달라지는 경우 이 정책을 업데이트하고 시행일 전에 안내합니다.",
        ],
      },
    ],
  },
};

const en: Record<LegalSlug, LegalDocument> = {
  terms: {
    eyebrow: "B2BB2G LEGAL",
    title: "Terms of Service",
    summary:
      "These terms govern registration, publishing, inquiries, transactions and use of the B2BB2G marketplace.",
    sections: [
      {
        id: "purpose",
        title: "1. Purpose",
        paragraphs: [
          "These Terms set out the conditions for using the B2BB2G B2B and B2G marketplace, including the rights, duties and responsibilities of B2BB2G and its members.",
        ],
      },
      {
        id: "definitions",
        title: "2. Definitions",
        items: [
          "“Service” means the marketplace features provided by B2BB2G, including listings, sourcing requests, events, profiles, inquiries, feeds, badges and memberships.",
          "“Member” means an individual or organization representative who completes email verification and registration.",
          "“Content” includes text, images, video links, files, product information, requests, messages and comments submitted to the Service.",
          "“Trading Parties” means members who discuss or enter into contracts for goods, services or projects through the Service.",
          "“Trust Badge” means an indicator issued under B2BB2G's verification and operating criteria.",
        ],
      },
      {
        id: "effect",
        title: "3. Publication and Changes",
        paragraphs: [
          "These Terms become effective when they are made available in the Service and accepted during registration or use.",
          "B2BB2G may amend these Terms to the extent permitted by law. Ordinary changes will generally be announced at least 7 days in advance, and material or adverse changes at least 30 days in advance, with the reason and effective date.",
          "A member who does not agree may terminate the account before the effective date. Mandatory law prevails over these Terms.",
        ],
      },
      {
        id: "account",
        title: "4. Registration and Accounts",
        items: [
          "Registration requires email verification, a valid invitation or referral where applicable, required information and acceptance of applicable policies.",
          "Members must have authority to act for themselves or their organization and must keep their information accurate.",
          "Credentials are personal to the member. Suspected misuse must be reported promptly after securing the account.",
          "False identities, automated or duplicate registrations, sanction evasion and unlawful use may be rejected or restricted.",
        ],
      },
      {
        id: "service",
        title: "5. Scope of the Service",
        paragraphs: [
          "B2BB2G provides listings, sourcing requests, events, notices, member profiles, network feeds, inquiries, badges, memberships, notifications and related administration features.",
          "Features may change for product improvement, security, legal compliance or operational reasons. Material changes will be announced in advance where practicable.",
        ],
      },
      {
        id: "member-duty",
        title: "6. Member Responsibilities",
        items: [
          "Members must comply with law, these Terms, Service guidance and agreements with other trading parties.",
          "Members must not publish illegal, misleading, infringing, malicious, discriminatory, abusive, spam or manipulated content.",
          "Members must not bypass security, scrape or reverse engineer the Service, send abnormal automated traffic or compromise another person's account or personal data.",
          "Passwords, one-time codes, payment credentials and unnecessary sensitive information must not be included in listings or inquiries.",
        ],
      },
      {
        id: "content",
        title: "7. Content and Intellectual Property",
        paragraphs: [
          "Members are responsible for the accuracy, legality and currency of their content, including specifications, certifications, origin, pricing, capacity, lead time and trade terms.",
          "Members retain ownership of their content and grant B2BB2G a non-exclusive license to host, reproduce, display and format it as necessary to operate, search, share and promote the Service.",
          "B2BB2G may review, restrict, remove or request changes to content that violates law, third-party rights or operating policy.",
        ],
      },
      {
        id: "communication",
        title: "8. Inquiries and Message Review",
        paragraphs: [
          "Initial business communications between members take place through the inquiry flow and may remain linked to the relevant listing.",
          "Operations staff may access and review messages and attachments to prevent spam, fraud and illegal activity, support quality and safety, and resolve disputes. Delivery may be held or returned with a reason.",
          "Members should agree separate confidentiality terms before sharing trade secrets. Operational review does not itself create a non-disclosure agreement.",
        ],
      },
      {
        id: "badges",
        title: "9. Trust Badges and Memberships",
        paragraphs: [
          "Badges and memberships are issued after review of submitted information, evidence, payment or eligibility criteria. A badge is not a guarantee of product quality, performance, creditworthiness or government endorsement.",
          "Benefits may be suspended or withdrawn if eligibility ends, documents are false or altered, a term expires or policy is violated.",
          "Prices, duration, benefits, payment and refund conditions for paid services are displayed at application or in separate notices. Mandatory law applies.",
        ],
      },
      {
        id: "transactions",
        title: "10. Marketplace Role and Transactions",
        paragraphs: [
          "B2BB2G provides an online venue and tools for members to discover and discuss goods, services and projects. Unless expressly stated, B2BB2G is not the seller, buyer, agent or contracting party in member transactions.",
          "Trading parties are responsible for agreeing and verifying price, specifications, quantity, inspection, certification, payment, delivery, logistics, customs, licenses, taxes, warranties and performance.",
          "Members must conduct their own due diligence. B2BB2G does not guarantee transaction completion, product fitness, payment recovery or contractual performance.",
        ],
      },
      {
        id: "suspension",
        title: "11. Restrictions and Termination",
        paragraphs: [
          "B2BB2G may restrict content, suspend features or terminate an account in proportion to a legal, security or policy violation. Except in urgent cases, the reason and an appeal channel will be provided.",
          "Members may withdraw through the dashboard. Public profile and contact data are de-identified, while content and transaction-related records may be anonymized or retained only as necessary for continuity, fraud prevention, disputes or legal obligations.",
        ],
      },
      {
        id: "availability",
        title: "12. Service Availability",
        paragraphs: [
          "The Service may be interrupted for maintenance, infrastructure or network failure, security incidents, force majeure, legal orders or third-party outages. Planned interruptions will be announced when practicable.",
        ],
      },
      {
        id: "liability",
        title: "13. Limitation of Liability",
        paragraphs: [
          "To the extent permitted by law, B2BB2G is not responsible for losses arising from member-provided information, agreements between trading parties, external links or a member's fault where B2BB2G is not at fault.",
          "Nothing in these Terms excludes liability that cannot be excluded under mandatory law, including liability for wilful misconduct, gross negligence or unlawful personal-data processing.",
        ],
      },
      {
        id: "notices",
        title: "14. Notices",
        paragraphs: [
          "Notices may be sent by registered email, in-service notification or notice board. A general notice posted for at least 7 days may replace individual notice, except that material impacts will be individually notified where practicable.",
        ],
      },
      {
        id: "disputes",
        title: "15. Governing Law and Disputes",
        paragraphs: [
          "These Terms are governed by the laws of the Republic of Korea. The parties will first seek an amicable resolution, and unresolved disputes will be submitted to a court with jurisdiction under applicable Korean procedural law.",
        ],
      },
      {
        id: "effective",
        title: "Supplementary Provision",
        paragraphs: ["These Terms apply from the effective date shown on this page."],
      },
    ],
  },
  privacy: {
    eyebrow: "B2BB2G PRIVACY",
    title: "Privacy Policy",
    summary:
      "This policy explains what personal data B2BB2G processes, why it is used, how long it is retained and how it is protected.",
    sections: [
      {
        id: "overview",
        title: "1. Scope",
        paragraphs: [
          "B2BB2G processes personal data lawfully and securely under the Korean Personal Information Protection Act and other applicable laws. This Policy describes collection, use, retention, disclosure, processing, deletion and data-subject rights.",
        ],
      },
      {
        id: "collection",
        title: "2. Data We Process",
        table: {
          headers: ["Context", "Data", "Collection method"],
          rows: [
            ["Registration", "Email, authentication data, registration path, invitation and referral data", "Entered by the member or generated during verification"],
            ["Profile", "UID, company, contact person, introduction, photo and contact details", "Entered in profile and contact settings"],
            ["Service use", "Content, media, files, video links, inquiries, replies, comments, badge applications and evidence", "Submitted while using features"],
            ["Security", "IP or masked IP, timestamps, browser and device information, login events and cookies", "Generated automatically during use"],
            ["Paid services", "Application, payment confirmation and processing records", "Submitted by the member or generated operationally"],
          ],
        },
      },
      {
        id: "purpose",
        title: "3. Purposes",
        items: [
          "Identity, email verification, invitation registration, login and account security",
          "Profiles, listings, projects, sourcing requests, events and network feeds",
          "Inquiry delivery, message review, notifications and member support",
          "Badge and membership verification, abuse prevention and policy enforcement",
          "Reliability, access analysis, incident response and legal compliance",
          "Complaints, disputes, rights requests and infringement response",
        ],
      },
      {
        id: "retention",
        title: "4. Retention",
        paragraphs: [
          "Data is deleted without undue delay when its purpose is complete, unless retention is required by law or reasonably necessary for disputes and fraud prevention.",
        ],
        table: {
          headers: ["Data or record", "Retention period"],
          rows: [
            ["Account, profile and contacts", "Until withdrawal; minimum authentication and dispute records may be restricted for up to 3 years"],
            ["Content, inquiries and messages", "During service; author identifiers are removed after withdrawal and records may remain for continuity and disputes"],
            ["Invitation and referral records", "Up to 3 years after expiry, revocation or use for abuse and dispute response"],
            ["Badge and membership evidence", "During verification and up to 3 years after the relationship ends, unless law requires longer"],
            ["Login and security events", "Configured operating period, currently 90 days by default; incident records until investigation closes"],
            ["Advertising records", "6 months where Korean e-commerce retention rules apply"],
            ["Contract, cancellation, payment and supply records", "5 years where Korean e-commerce retention rules apply"],
            ["Complaint and dispute records", "3 years where Korean e-commerce retention rules apply"],
          ],
        },
      },
      {
        id: "third-parties",
        title: "5. Third-Party Disclosure",
        paragraphs: [
          "B2BB2G does not ordinarily disclose personal data to third parties. Disclosure may occur with prior consent, where required by law, or to protect urgent life, safety or property interests as permitted by law.",
          "If a member joined through a referring coordinator, that coordinator may access registered contact details or inquiry status within configured permissions for member support. The member may request that Operations stop such access.",
        ],
      },
      {
        id: "processors",
        title: "6. Processors",
        table: {
          headers: ["Processor", "Processing service"],
          rows: [
            ["Supabase, Inc.", "Database, authentication, storage and infrastructure"],
            ["Resend, Inc.", "Authentication and transactional email delivery"],
            ["Intuition Machines, Inc. (hCaptcha)", "Automated abuse and bot detection"],
          ],
        },
      },
      {
        id: "overseas",
        title: "7. International Processing",
        table: {
          headers: ["Recipient and location", "Data and purpose", "Period"],
          rows: [
            ["Supabase, Inc. / selected project region (Republic of Korea)", "Account, profile, content, inquiries and files for hosting and authentication", "Until service termination or deletion"],
            ["Resend, Inc. / United States", "Email address, notification content and delivery metadata", "For delivery, error handling and the provider's applicable log period"],
            ["Intuition Machines, Inc. / United States and distributed infrastructure", "IP, browser and device signals and challenge result for security", "For real-time verification and necessary security processing"],
          ],
        },
        paragraphs: [
          "Transfers occur over encrypted networks when the relevant service is used. Refusing optional processing does not affect essential features, but refusing authentication email or security verification may prevent registration, login or certain functions.",
        ],
      },
      {
        id: "destruction",
        title: "8. Deletion",
        items: [
          "Expired data is separated from legally retained data and deleted without undue delay.",
          "Electronic files are deleted using methods designed to prevent practical recovery, and paper documents are shredded or destroyed.",
          "Public profile and contact data are de-identified on withdrawal; legally retained records are restricted and later deleted.",
        ],
      },
      {
        id: "rights",
        title: "9. Your Rights",
        paragraphs: [
          "You may request access, correction, deletion, restriction, withdrawal of consent or account closure through profile and security settings or the in-service inquiry channel.",
          "B2BB2G may verify authority for representative requests. A request may be limited where necessary to protect another person's rights or comply with law, and the reason will be explained.",
        ],
      },
      {
        id: "children",
        title: "10. Children",
        paragraphs: [
          "B2BB2G is a business service and does not permit registration by children under 14. If such data is identified, appropriate steps will be taken under applicable law.",
        ],
      },
      {
        id: "security",
        title: "11. Security Measures",
        items: [
          "Role-based and least-privilege access, multi-factor authentication for administrators and access logging",
          "Encrypted transport, secure authentication handling and restricted access to sensitive data",
          "Security-event and suspicious-login detection, vulnerability checks, backup and incident response",
          "Privacy obligations for staff and processors",
        ],
      },
      {
        id: "cookies",
        title: "12. Cookies",
        paragraphs: [
          "Cookies and similar technologies support login, language and consent settings, security and user experience. Essential cookies are necessary; analytics cookies are used only with consent. See the Cookie Policy for details.",
        ],
      },
      {
        id: "contact",
        title: "13. Privacy Contact",
        paragraphs: [
          "Privacy requests and complaints may be submitted to B2BB2G Operations through the in-service inquiry channel. Requests are handled after identity verification in accordance with applicable law.",
        ],
      },
      {
        id: "remedies",
        title: "14. Korean Privacy Remedies",
        items: [
          "KISA Privacy Infringement Center: 118 (privacy.kisa.or.kr)",
          "Personal Information Dispute Mediation Committee: 1833-6972 (kopico.go.kr)",
          "Supreme Prosecutors' Office: 1301 (spo.go.kr)",
          "Korean National Police Cyber Bureau: 182 (ecrm.police.go.kr)",
        ],
      },
      {
        id: "changes",
        title: "15. Changes to This Policy",
        paragraphs: [
          "Changes will be announced with their effective date and reason. Material changes affecting data-subject rights will generally be announced at least 30 days in advance and other changes at least 7 days in advance.",
        ],
      },
    ],
  },
  cookies: {
    eyebrow: "B2BB2G COOKIE POLICY",
    title: "Cookie Policy",
    summary:
      "This policy explains the cookies B2BB2G uses, why they are needed, how long they remain and how you can change your choices.",
    sections: [
      {
        id: "definition",
        title: "1. What Are Cookies?",
        paragraphs: [
          "Cookies are small pieces of data stored by a website in your browser. They preserve login state, language and privacy choices and support security and reliable navigation. Similar technologies such as local storage are covered here as well.",
        ],
      },
      {
        id: "categories",
        title: "2. Cookie Categories",
        table: {
          headers: ["Category", "Purpose", "Typical duration"],
          rows: [
            ["Essential", "Authentication, security tokens, language, consent and essential interface state", "Session or configured expiry"],
            ["Security signals", "hCaptcha bot, abnormal signup and login, and abuse prevention", "Real-time verification and necessary security period"],
            ["Analytics", "Aggregate visits and feature use to improve performance and usability", "Only after consent, until tool-specific expiry"],
            ["External content storage", "Video or other embedded content choices and playback state", "Provider policy or browser settings"],
          ],
        },
      },
      {
        id: "essential",
        title: "3. Essential Cookies",
        paragraphs: [
          "Essential cookies are required for account authentication, security, language and saving your cookie choices. Blocking them in the browser may prevent login or other core functions.",
        ],
      },
      {
        id: "analytics",
        title: "4. Optional Cookies and Consent",
        paragraphs: [
          "B2BB2G currently operates primarily with essential cookies. If analytics tools are enabled, optional cookies are set only after consent, and refusing them does not prevent use of essential features.",
          "You can change analytics consent below at any time. You may need to separately delete existing third-party cookies in your browser.",
        ],
      },
      {
        id: "controls",
        title: "5. Browser Controls",
        items: [
          "Chrome: Settings → Privacy and security → Third-party cookies",
          "Safari: Settings → Privacy → Manage Website Data",
          "Microsoft Edge: Settings → Cookies and site permissions",
          "Firefox: Settings → Privacy & Security → Cookies and Site Data",
        ],
      },
      {
        id: "third-party",
        title: "6. Third-Party Services",
        paragraphs: [
          "hCaptcha security verification and external content such as privacy-enhanced video may use cookies or similar technologies. See the Privacy Policy and the relevant provider's policy for details.",
        ],
      },
      {
        id: "contact",
        title: "7. Contact and Updates",
        paragraphs: [
          "Cookie questions may be submitted to B2BB2G Operations through the in-service inquiry channel. Changes to cookie categories or purposes will be reflected here and announced before they take effect.",
        ],
      },
    ],
  },
};

const ui: Record<Locale, LegalUi> = {
  ko: {
    contents: "목차",
    effectiveDate: "시행일",
    version: "버전",
    operator: "서비스 운영",
    privacyDepartment: "개인정보 보호 담당",
    contactChannel: "접수 경로",
    contactAction: "문의함 열기",
    documentNavigation: "법률 문서",
    importantNotice:
      "본 문서는 현재 서비스 기능과 대한민국 관계 법령을 기준으로 작성되었습니다.",
  },
  en: {
    contents: "Contents",
    effectiveDate: "Effective",
    version: "Version",
    operator: "Service operator",
    privacyDepartment: "Privacy department",
    contactChannel: "Request channel",
    contactAction: "Open inquiries",
    documentNavigation: "Legal documents",
    importantNotice:
      "This document reflects the current Service and applicable laws of the Republic of Korea.",
  },
};

export function getLegalDocument(locale: Locale, slug: LegalSlug) {
  return (locale === "ko" ? ko : en)[slug];
}

export function getLegalUi(locale: Locale) {
  return ui[locale];
}
