// Structured, categorized help-center content for /faq. Curated (not admin
// posts) so it can be grouped into topics and read like a short user manual.
// Bilingual; the page picks ko/en by locale. Each answer is an array of short
// lines (a sentence or a numbered step) rendered as paragraphs.
export type FaqGuideQA = {
  q_ko: string;
  q_en: string;
  a_ko: string[];
  a_en: string[];
};

export type FaqGuideCategoryData = {
  id: string;
  title_ko: string;
  title_en: string;
  items: FaqGuideQA[];
};

export const FAQ_GUIDE: FaqGuideCategoryData[] = [
  {
    id: "getting-started",
    title_ko: "시작하기",
    title_en: "Getting started",
    items: [
      {
        q_ko: "B2BB2G는 어떤 곳이에요?",
        q_en: "What is B2BB2G?",
        a_ko: [
          "B2BB2G는 상품과 요청을 소개하고, 확인을 거친 안전한 비즈니스 대화를 시작하는 곳이에요.",
          "회원끼리 파는 것을 올리거나 찾는 것을 올려서 서로 연결돼요.",
        ],
        a_en: [
          "B2BB2G is a place to introduce products and requests, and to start reviewed business conversations.",
          "Members post what they sell or what they are looking for, and connect with each other.",
        ],
      },
      {
        q_ko: "어떻게 가입해요?",
        q_en: "How do I join?",
        a_ko: [
          "가입은 초대 링크로 해요. 사이트 설정에 따라 초대가 있어야만 가입할 수 있어요.",
          "1) 받은 초대 링크를 열어요.",
          "2) 이메일과 비밀번호를 정해요.",
          "3) 안내에 따라 가입을 마쳐요.",
        ],
        a_en: [
          "You join with an invitation link. Depending on the site setting, joining may be invite-only.",
          "1) Open the invite link you received.",
          "2) Set your email and password.",
          "3) Follow the steps to finish signing up.",
        ],
      },
      {
        q_ko: "UID가 뭐예요?",
        q_en: "What is a UID?",
        a_ko: [
          "회원은 실제 이름 대신 숫자로 된 UID로 표시돼요.",
          "UID가 나를 나타내는 기본 이름이에요.",
          "프로필에서 내 UID를 복사할 수 있어요.",
        ],
        a_en: [
          "Members appear as a numeric UID instead of a real name.",
          "The UID is your main identifier.",
          "You can copy your UID from your profile.",
        ],
      },
      {
        q_ko: "로그인은 어떻게 해요?",
        q_en: "How do I log in?",
        a_ko: ["가입할 때 정한 이메일과 비밀번호로 로그인해요."],
        a_en: ["Log in with the email and password you set when you joined."],
      },
      {
        q_ko: "비밀번호를 잊었어요.",
        q_en: "I forgot my password.",
        a_ko: [
          "로그인 화면에 있는 비밀번호 재설정 링크를 눌러요.",
          "안내에 따라 새 비밀번호를 정하면 돼요.",
        ],
        a_en: [
          "Tap the password reset link on the login page.",
          "Then follow the steps to set a new password.",
        ],
      },
    ],
  },
  {
    id: "selling",
    title_ko: "상품 올리기",
    title_en: "Posting a product",
    items: [
      {
        q_ko: "상품은 어떻게 올려요?",
        q_en: "How do I post a product?",
        a_ko: [
          "1) 헤더에서 '상품 등록'을 눌러요.",
          "2) 게시판을 골라요.",
          "3) 제목, 내용, 사진, 사양을 채워요.",
          "4) 등록을 누르면 '검토 대기' 상태가 되고, 운영팀이 승인하면 공개돼요.",
        ],
        a_en: [
          "1) Tap 'Register a product' in the header.",
          "2) Pick a board.",
          "3) Fill in the title, body, photos, and spec fields.",
          "4) Submit it. It becomes 'pending' and goes public only after the operations team approves it.",
        ],
      },
      {
        q_ko: "어떤 게시판을 골라야 해요?",
        q_en: "Which board should I choose?",
        a_ko: [
          "Commercial은 바로 쓸 수 있는 소비재예요.",
          "Industrial은 장비, 부품, 제조 관련이에요.",
          "EPF+C는 에너지와 인프라 프로젝트예요.",
        ],
        a_en: [
          "Commercial is for consumer-ready goods.",
          "Industrial is for equipment, parts, and manufacturing.",
          "EPF+C is for energy and infrastructure projects.",
        ],
      },
      {
        q_ko: "사진과 사양은 꼭 넣어야 해요?",
        q_en: "Do I need photos and specs?",
        a_ko: [
          "사진과 사양을 넣으면 상대가 상품을 더 잘 이해해요.",
          "제목, 내용, 사진, 사양 칸을 채워서 올려요.",
        ],
        a_en: [
          "Adding photos and specs helps the other side understand your product.",
          "Fill in the title, body, photos, and spec fields when you post.",
        ],
      },
      {
        q_ko: "아직 다 못 썼어요. 저장할 수 있어요?",
        q_en: "Can I save it before finishing?",
        a_ko: ["네, 임시 저장(초안)을 할 수 있어요.", "나중에 이어서 작성하면 돼요."],
        a_en: ["Yes, you can save a draft.", "You can finish it later."],
      },
      {
        q_ko: "올린 글은 어디서 관리해요?",
        q_en: "Where do I manage my posts?",
        a_ko: [
          "대시보드의 '내 게시글'에서 관리해요.",
          "여기서 수정하거나 삭제할 수 있어요.",
        ],
        a_en: [
          "Manage them in Dashboard > 'My posts'.",
          "There you can edit or delete them.",
        ],
      },
      {
        q_ko: "'검토 대기'와 '승인'은 뭐예요?",
        q_en: "What do 'pending' and 'approved' mean?",
        a_ko: [
          "등록한 글은 먼저 '검토 대기' 상태가 돼요.",
          "운영팀이 확인하고 승인하면 다른 회원에게 공개돼요.",
        ],
        a_en: [
          "A new post first goes to 'pending'.",
          "After the operations team reviews and approves it, it becomes public to other members.",
        ],
      },
    ],
  },
  {
    id: "requests",
    title_ko: "요청 올리기",
    title_en: "Posting a request",
    items: [
      {
        q_ko: "요청(RFQ & ITB)이 뭐예요?",
        q_en: "What is a request (RFQ & ITB)?",
        a_ko: [
          "요청은 내가 '찾고 있는 것'을 올리는 곳이에요.",
          "견적이나 입찰을 부탁하는 글이에요.",
          "상품을 파는 것과 반대예요.",
        ],
        a_en: [
          "A request is where you post what you are looking for.",
          "It is a post asking for a quote or a bid.",
          "It is the opposite of selling a product.",
        ],
      },
      {
        q_ko: "요청은 어떻게 올려요?",
        q_en: "How do I post a request?",
        a_ko: [
          "1) 'RFQ & ITB' 게시판으로 가요.",
          "2) 무엇을 찾는지 적어요.",
          "3) 등록해요.",
        ],
        a_en: [
          "1) Go to the 'RFQ & ITB' board.",
          "2) Write what you are looking for.",
          "3) Submit it.",
        ],
      },
      {
        q_ko: "마감 기한을 정할 수 있어요?",
        q_en: "Can I set a deadline?",
        a_ko: ["네, 마감 기한을 정할 수 있어요.", "또는 기한 없이 열어 둘 수도 있어요."],
        a_en: ["Yes, you can set a deadline.", "Or you can leave it open-ended."],
      },
      {
        q_ko: "상품 글과 뭐가 달라요?",
        q_en: "How is it different from a product post?",
        a_ko: [
          "상품 글은 파는 것을 소개해요.",
          "요청 글은 찾는 것을 알려요.",
          "찾는 것을 올리고 싶으면 요청을 써요.",
        ],
        a_en: [
          "A product post introduces something you sell.",
          "A request tells others what you are looking for.",
          "Use a request when you want to post what you need.",
        ],
      },
    ],
  },
  {
    id: "inquiries",
    title_ko: "문의",
    title_en: "Inquiries",
    items: [
      {
        q_ko: "상품에 대해 어떻게 연락해요?",
        q_en: "How do I contact about a product?",
        a_ko: [
          "상품이나 요청 상세 페이지에서 문의를 보내요.",
          "궁금한 내용을 적어서 보내면 돼요.",
        ],
        a_en: [
          "Send an inquiry from the product or request detail page.",
          "Just write your question and send it.",
        ],
      },
      {
        q_ko: "내 문의는 바로 상대에게 가나요?",
        q_en: "Does my inquiry go straight to the other member?",
        a_ko: [
          "먼저 운영팀이 문의를 확인해요.",
          "확인 후 상대 회원에게 전달하거나, 이유와 함께 돌려줘요.",
        ],
        a_en: [
          "The operations team checks your inquiry first.",
          "Then they forward it to the other member, or return it with a reason.",
        ],
      },
      {
        q_ko: "주고받은 문의는 어디서 봐요?",
        q_en: "Where can I see my inquiries?",
        a_ko: ["헤더의 '문의' 메뉴에서 모든 문의를 볼 수 있어요."],
        a_en: ["You can see all your inquiries in the 'Inquiries' menu."],
      },
      {
        q_ko: "상대가 읽었는지 알 수 있어요?",
        q_en: "Can I tell if it was read?",
        a_ko: ["네, 읽음 표시가 있어서 상대가 읽었는지 알 수 있어요."],
        a_en: ["Yes, there are read receipts, so you can tell if it was read."],
      },
    ],
  },
  {
    id: "invites",
    title_ko: "초대하기",
    title_en: "Inviting people",
    items: [
      {
        q_ko: "초대 링크는 어떻게 만들어요?",
        q_en: "How do I create an invite link?",
        a_ko: [
          "1) 대시보드의 '내 초대 링크'로 가요.",
          "2) 초대를 만들어요.",
          "3) 링크를 복사해요.",
        ],
        a_en: [
          "1) Go to Dashboard > 'My referral link'.",
          "2) Create an invitation.",
          "3) Copy the link.",
        ],
      },
      {
        q_ko: "한 링크로 몇 명이 가입할 수 있어요?",
        q_en: "How many people can join with one link?",
        a_ko: [
          "한 링크는 한 사람만 쓸 수 있어요.",
          "한 명이 가입하면 다시 쓰거나 다른 사람에게 보낼 수 없어요.",
        ],
        a_en: [
          "One link is single-use, so only one person can sign up.",
          "After someone signs up, it cannot be reused or reshared.",
        ],
      },
      {
        q_ko: "링크를 나중에 다시 볼 수 있어요?",
        q_en: "Can I see the link again later?",
        a_ko: [
          "아니요, 보안을 위해 만든 직후 한 번만 보여줘요.",
          "그러니 바로 복사해 두세요.",
        ],
        a_en: [
          "No. For security it is shown only once, right after you create it.",
          "So copy it immediately.",
        ],
      },
      {
        q_ko: "특정 사람만 쓰게 할 수 있어요?",
        q_en: "Can I limit who uses it?",
        a_ko: [
          "네, 이메일 하나로 제한할 수 있어요.",
          "그러면 그 이메일만 그 링크로 가입할 수 있어요.",
        ],
        a_en: [
          "Yes, you can limit it to one email address.",
          "Then only that email can use the link.",
        ],
      },
      {
        q_ko: "초대를 취소할 수 있어요?",
        q_en: "Can I cancel an invite?",
        a_ko: [
          "네, 만든 초대를 취소(폐기)할 수 있어요.",
          "또 시간이 지나면 자동으로 만료돼요.",
        ],
        a_en: [
          "Yes, you can revoke an invitation you made.",
          "It also expires automatically over time.",
        ],
      },
    ],
  },
  {
    id: "coordinator",
    title_ko: "코디네이터",
    title_en: "Coordinator",
    items: [
      {
        q_ko: "코디네이터가 누구예요?",
        q_en: "Who is my coordinator?",
        a_ko: ["나를 초대해 준 사람이 내 코디네이터예요."],
        a_en: ["The person who invited you is your coordinator."],
      },
      {
        q_ko: "코디네이터와 연락할 수 있어요?",
        q_en: "Can I contact my coordinator?",
        a_ko: ["네, 코디네이터에게 다이렉트 메시지를 바로 보낼 수 있어요."],
        a_en: ["Yes, you can send your coordinator a direct message."],
      },
      {
        q_ko: "내가 초대한 사람은 어디서 봐요?",
        q_en: "Where can I see people I invited?",
        a_ko: [
          "내가 초대한 사람은 '코디네이터' 대시보드에 나와요.",
          "거기서 이 회원들을 관리할 수 있어요.",
        ],
        a_en: [
          "People you invited appear in your 'Coordinator' dashboard.",
          "There you can manage them.",
        ],
      },
    ],
  },
  {
    id: "social",
    title_ko: "소셜·네트워크",
    title_en: "Social network",
    items: [
      {
        q_ko: "소셜(B2BB2G Network)은 뭐예요?",
        q_en: "What is the social network?",
        a_ko: [
          "/feed에서 짧은 소식을 올리는 공간이에요.",
          "다른 회원과 편하게 소통할 수 있어요.",
        ],
        a_en: [
          "At /feed you can post short updates.",
          "It is a place to connect with other members.",
        ],
      },
      {
        q_ko: "글에 어떤 반응을 할 수 있어요?",
        q_en: "What can I do with a post?",
        a_ko: [
          "좋아요, 댓글, 리포스트를 할 수 있어요.",
          "마음에 드는 회원은 팔로우할 수 있어요.",
        ],
        a_en: [
          "You can like, comment, and repost.",
          "You can also follow members you like.",
        ],
      },
      {
        q_ko: "해시태그는 어떻게 써요?",
        q_en: "How do I use hashtags?",
        a_ko: ["'#'를 붙여서 해시태그를 써요.", "예: #장비"],
        a_en: ["Add '#' to make a hashtag.", "Example: #equipment"],
      },
      {
        q_ko: "팔로우하면 뭐가 좋아요?",
        q_en: "Why follow someone?",
        a_ko: ["관심 있는 회원을 팔로우하면 그 회원의 소식을 더 쉽게 볼 수 있어요."],
        a_en: [
          "Following a member helps you keep up with their updates more easily.",
        ],
      },
      {
        q_ko: "불편한 사람은 어떻게 해요?",
        q_en: "What if someone bothers me?",
        a_ko: ["그 회원을 차단하거나 신고할 수 있어요."],
        a_en: ["You can block or report that user."],
      },
    ],
  },
  {
    id: "account",
    title_ko: "프로필·배지·보안",
    title_en: "Profile, badges & security",
    items: [
      {
        q_ko: "프로필은 어떻게 바꿔요?",
        q_en: "How do I edit my profile?",
        a_ko: ["프로필에서 소개, 회사 이름, 프로필 사진을 바꿀 수 있어요."],
        a_en: ["In Profile you can edit your intro, company name, and avatar."],
      },
      {
        q_ko: "배지는 어떻게 받아요?",
        q_en: "How do I get a badge?",
        a_ko: [
          "'배지 신청'으로 신청해요.",
          "검토 후에 배지가 부여돼요.",
          "배지는 신뢰를 보여줘요. 예: Verified.",
        ],
        a_en: [
          "Apply through 'Request a badge'.",
          "After review, the badge is granted.",
          "Badges show trust. Example: Verified.",
        ],
      },
      {
        q_ko: "2단계 인증은 뭐예요?",
        q_en: "What is two-step verification?",
        a_ko: [
          "인증 앱(OTP)으로 하는 2단계 인증이에요.",
          "로그인할 때 한 단계를 더 확인해서 더 안전해요.",
          "OTP 앱을 잃어버리면, 이메일로 받은 재설정 코드로 복구해요.",
        ],
        a_en: [
          "It is two-step verification with an authenticator app (OTP).",
          "It adds one more check at login for safety.",
          "If you lose your OTP app, recover with an emailed reset code.",
        ],
      },
      {
        q_ko: "앱 잠금은 어떻게 해요?",
        q_en: "How does the app lock work?",
        a_ko: [
          "6자리 PIN으로 앱을 잠글 수 있어요.",
          "지문이나 Face ID도 함께 쓸 수 있어요.",
        ],
        a_en: [
          "You can lock the app with a 6-digit PIN.",
          "You can also use fingerprint or Face ID.",
        ],
      },
      {
        q_ko: "내 로그인 기록을 볼 수 있어요?",
        q_en: "Can I check my login history?",
        a_ko: [
          "네, 신뢰하는 기기와 로그인 기록을 확인할 수 있어요.",
          "비밀번호는 언제든지 바꿀 수 있어요.",
        ],
        a_en: [
          "Yes, you can review your trusted devices and login history.",
          "You can reset your password anytime.",
        ],
      },
    ],
  },
  {
    id: "more",
    title_ko: "기타",
    title_en: "More",
    items: [
      {
        q_ko: "관심 상품을 저장할 수 있어요?",
        q_en: "Can I save products I like?",
        a_ko: [
          "네, 상품을 '찜'하면 '저장한 상품'에 담겨요.",
          "여러 상품을 나란히 비교할 수도 있어요.",
        ],
        a_en: [
          "Yes, bookmark a product and it goes to your 'Saved products'.",
          "You can also compare several side by side.",
        ],
      },
      {
        q_ko: "새 알림은 어디서 봐요?",
        q_en: "Where do I see notifications?",
        a_ko: [
          "헤더의 종 아이콘에서 알림을 봐요.",
          "새 알림이 있으면 점이 표시돼요.",
          "알림 설정에서 종류별로 푸시를 켜고 끌 수 있어요.",
        ],
        a_en: [
          "See notifications from the bell icon in the header.",
          "A dot appears when there is something new.",
          "In notification settings you can turn each type of push on or off.",
        ],
      },
      {
        q_ko: "미니 홈페이지가 뭐예요?",
        q_en: "What is a mini homepage?",
        a_ko: ["인증 회원은 간단한 프로필 페이지를 운영할 수 있어요."],
        a_en: ["Certified members can run a simple profile page."],
      },
      {
        q_ko: "멤버십은 어디서 봐요?",
        q_en: "Where can I learn about membership?",
        a_ko: ["인증 멤버십 정보는 멤버십 페이지에서 볼 수 있어요."],
        a_en: ["You can find certified membership info on the Membership page."],
      },
      {
        q_ko: "언어를 바꿀 수 있어요?",
        q_en: "Can I change the language?",
        a_ko: ["네, 헤더에서 한국어와 영어를 바꿀 수 있어요."],
        a_en: ["Yes, you can switch between Korean and English from the header."],
      },
      {
        q_ko: "문제가 생기면 어떻게 해요?",
        q_en: "What if something goes wrong?",
        a_ko: ["문의를 보내거나 공지를 확인해 보세요."],
        a_en: ["Send an inquiry or check the Notices."],
      },
    ],
  },
];
