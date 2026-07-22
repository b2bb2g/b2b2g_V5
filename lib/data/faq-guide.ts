// Structured, categorized help-center content for /faq. Curated (not admin
// posts) so it can be grouped into topics and read like a short user manual.
// Bilingual; the page picks ko/en by locale. Each answer is an array of short
// lines; a line that begins "1) ", "2) "... is rendered as a numbered step.
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
    "id": "basics",
    "title_ko": "처음이신가요?",
    "title_en": "Getting Started",
    "items": [
      {
        "q_ko": "B2BB2G는 무엇입니까?",
        "q_en": "What is B2BB2G?",
        "a_ko": [
          "B2BB2G는 기업과 기관이 상품과 구매요청을 등록하고 서로 연결되는 온라인 마켓플레이스입니다.",
          "판매할 상품은 상품 게시판에 등록하고, 필요한 물품·서비스는 구매요청(RFQ & ITB)으로 등록하여 거래 상대를 찾습니다.",
          "모든 회원은 실명 대신 고유 번호인 UID로 표시됩니다."
        ],
        "a_en": [
          "B2BB2G is an online marketplace where companies and public organizations post products and requests and connect with each other.",
          "You can post products for sale on a board, or post a request to find what you need.",
          "Every member is shown by a numeric UID (a unique member number) instead of a real name."
        ]
      },
      {
        "q_ko": "어떻게 가입합니까?",
        "q_en": "How do I join?",
        "a_ko": [
          "가입은 다른 회원이 보내 준 초대 링크로만 진행합니다. 사이트 설정에 따라 초대받은 사람만 가입할 수 있습니다.",
          "1) 받은 초대 링크를 눌러 가입 화면을 엽니다.",
          "2) 이메일과 사용할 비밀번호를 입력합니다.",
          "3) 필수 항목(이용약관·개인정보 수집·이용·쿠키 정책)에 동의합니다. 광고성 정보 수신은 선택이며, 원할 경우 함께 체크합니다.",
          "4) '가입' 버튼을 눌러 완료합니다.",
          "※ 화면이 영어로 표시되면 오른쪽 위 지구본에서 한국어로 바꾼 뒤 진행하세요. 비밀번호 조건 등을 한국어로 확인할 수 있습니다."
        ],
        "a_en": [
          "You join with an invite link (a sign-up web address that another member sends you). Depending on site settings, only invited people can join.",
          "1) Tap the invite link you received to open the sign-up screen.",
          "2) Enter your email and the password you want to use.",
          "3) Agree to the required items (Terms, Privacy, Cookie Policy). Marketing messages are optional — check the box too if you want them.",
          "4) Press the sign-up button to finish."
        ]
      },
      {
        "q_ko": "가입할 때 동의 항목은 무엇입니까?",
        "q_en": "What am I agreeing to when I sign up?",
        "a_ko": [
          "동의 항목은 필수 3가지와 선택 1가지입니다.",
          "1) (필수) 이용약관 · 개인정보 수집·이용 · 쿠키 정책 — 세 가지에 모두 동의해야 '가입' 버튼이 활성화됩니다. 각 항목의 '보기'를 눌러 전문을 확인할 수 있습니다.",
          "2) (선택) 광고성 정보 수신 — 이메일·문자로 혜택과 소식을 받는 데 동의하는 항목입니다. 체크하지 않아도 가입할 수 있으며, 가입 후 알림 화면에서 언제든 켜고 끌 수 있습니다.",
          "※ 맨 위의 '전체 동의'를 누르면 네 항목이 한 번에 체크됩니다."
        ],
        "a_en": [
          "Three required items and one optional item.",
          "1) (Required) Terms of Service, Privacy (collection & use), and Cookie Policy — you must agree to these three for the sign-up button to turn on. Tap 'View' on each to read the full text.",
          "2) (Optional) Marketing messages — consent to receive offers and news by email / SMS. You can sign up without it, and turn it on or off anytime later.",
          "The 'Agree to all' option at the top checks everything at once."
        ]
      },
      {
        "q_ko": "UID가 무엇입니까?",
        "q_en": "What is a UID?",
        "a_ko": [
          "UID는 회원마다 하나씩 부여되는 숫자 번호로, 사이트에서 회원을 구분하는 대표 식별자입니다.",
          "다른 회원에게는 실명 대신 이 UID가 표시되므로, 회사 정보와 UID만으로 안전하게 거래할 수 있습니다."
        ],
        "a_en": [
          "A UID is a numeric number given to each member. It is the main way members are identified on the site.",
          "Other members see this UID instead of your real name."
        ]
      },
      {
        "q_ko": "어떻게 로그인합니까?",
        "q_en": "How do I log in?",
        "a_ko": [
          "1) 첫 화면에서 로그인 화면을 엽니다. 헤더의 '로그인'을 눌러 들어갑니다.",
          "2) 가입할 때 사용한 이메일을 입력합니다.",
          "3) 비밀번호를 입력합니다.",
          "4) '로그인' 버튼을 누릅니다.",
          "※ 2단계 인증을 켜 두었다면, 로그인 후 인증 앱의 여섯 자리 코드를 한 번 더 입력합니다."
        ],
        "a_en": [
          "1) Open the login screen from the site's first page.",
          "2) Enter the email you used when you signed up.",
          "3) Enter your password.",
          "4) Press the login button."
        ]
      },
      {
        "q_ko": "비밀번호를 잊었습니다. 어떻게 합니까?",
        "q_en": "I forgot my password. What do I do?",
        "a_ko": [
          "1) 로그인 화면을 엽니다.",
          "2) 비밀번호 입력칸 아래의 '비밀번호 재설정' 링크를 누릅니다.",
          "3) 가입한 이메일을 입력하면 재설정 안내 메일이 발송됩니다.",
          "4) 메일 속 링크를 눌러 새 비밀번호를 설정합니다.",
          "※ 새 비밀번호도 가입 때와 같은 조건(10자 이상, 영문 대문자·소문자·숫자·특수문자 각 1개 이상)을 충족해야 합니다."
        ],
        "a_en": [
          "1) Open the login screen.",
          "2) Tap the reset link below the password box (the link to set a new password).",
          "3) Enter your email and receive the guide email.",
          "4) Tap the link in the email and set a new password."
        ]
      },
      {
        "q_ko": "화면 언어를 바꾸고 싶습니다. (한국어로 보기)",
        "q_en": "I want to change the screen language. (Viewing in Korean)",
        "a_ko": [
          "브라우저(인터넷 프로그램) 언어가 한국어이면 처음부터 자동으로 한국어로 표시됩니다. 따로 바꾸지 않아도 됩니다.",
          "직접 바꾸려면 지구본 아이콘을 누르고 언어를 고릅니다. [PC] 헤더 오른쪽의 지구본. [휴대폰] 오른쪽 위 메뉴 버튼(≡)을 누른 뒤 서랍 안의 언어.",
          "로그인·회원가입 화면에서도 오른쪽 위 지구본으로 바꿀 수 있습니다. 그래서 가입할 때 비밀번호 조건 같은 안내도 한국어로 볼 수 있습니다.",
          "한 번 고르면 그 선택이 계속 유지됩니다."
        ],
        "a_en": [
          "If your browser's language is Korean, the site shows Korean automatically from the first visit — no change needed.",
          "To change it yourself, press the globe icon and pick a language. [PC] the globe on the right of the header. [Phone] press the menu button (≡) at the top right, then Language inside the drawer.",
          "The globe is also on the login and sign-up screens (top right), so you can read the sign-up guidance (such as the password rules) in Korean too.",
          "Once you pick a language, that choice is kept."
        ]
      }
    ]
  },
  {
    "id": "wayfinding",
    "title_ko": "화면 둘러보기",
    "title_en": "Finding Your Way",
    "items": [
      {
        "q_ko": "헤더(화면 맨 위 줄)에는 무엇이 있습니까? (PC와 휴대폰이 다릅니다)",
        "q_en": "What is on the header (the top bar)? (PC and phone differ)",
        "a_ko": [
          "왼쪽 로고(B2BB2G)는 PC·휴대폰 공통입니다. 누르면 첫 화면으로 돌아갑니다.",
          "[넓은 화면(PC)] 가운데에 게시판 메뉴가 나란히 펼쳐집니다: Commercial, Industrial, EPF+C(Local), RFQ & ITB, Events, Services, Notices, FAQ. 오른쪽에는 돋보기(검색), 지구본(언어), 종(알림)이 있고, 로그인하면 동그란 프로필 사진(= '내 메뉴')이 보입니다.",
          "[좁은 화면(휴대폰)] 맨 위 줄에는 로고, 종(알림), 그리고 줄 세 개 모양의 메뉴 버튼(≡)만 보입니다. 게시판 메뉴·검색·언어·내 메뉴·로그인은 모두 메뉴 버튼(≡)을 눌러 열리는 서랍(아래로 펼쳐지는 목록) 안에 들어 있습니다.",
          "즉 PC에서 위쪽에 흩어져 있는 것들이, 휴대폰에서는 메뉴 버튼(≡) 하나에 모여 있다고 생각하면 됩니다."
        ],
        "a_en": [
          "The left logo (B2BB2G) is the same on PC and phone. Pressing it returns you to the first page.",
          "[Wide screen (PC)] The board menus spread across the middle: Commercial, Industrial, EPF+C(Local), RFQ & ITB, Events, Services, Notices, FAQ. On the right are a magnifying glass (search), a globe (language), and a bell (notifications); after you log in, a round profile photo (= 'My Menu') appears.",
          "[Narrow screen (phone)] The top bar shows only the logo, the bell (notifications), and a three-line menu button (≡). The board menus, search, language, My Menu and login all live inside the drawer that opens when you press the menu button (≡).",
          "In short: what is spread across the top on PC is gathered into the one menu button (≡) on a phone."
        ]
      },
      {
        "q_ko": "'내 메뉴'는 어디에 있고 안에 무엇이 있습니까?",
        "q_en": "Where is 'My Menu' and what is inside?",
        "a_ko": [
          "[PC] 로그인한 뒤 헤더 오른쪽 위의 동그란 프로필 사진을 누르면 '내 메뉴'가 열립니다.",
          "[휴대폰] 오른쪽 위 메뉴 버튼(≡)을 누르면 서랍이 열리고, 그 안 위쪽에 프로필 사진과 함께 같은 '내 메뉴' 항목들이 있습니다.",
          "안에는 대시보드, 활동(내 게시글·문의 내역·저장한 상품), 만들기(상품 등록·구매요청 등록), 커뮤니티(피드), 계정(프로필·보안)이 있습니다."
        ],
        "a_en": [
          "[PC] After logging in, press the round profile photo at the top right of the header — 'My Menu' opens.",
          "[Phone] Press the menu button (≡) at the top right to open the drawer; the same 'My Menu' items are near the top of it, next to your profile photo.",
          "Inside are Dashboard, Activity (My posts, Inquiries, Saved products), Create (Add a product, Post a sourcing request), Community (Feed), and Account (Profile, Security)."
        ]
      },
      {
        "q_ko": "대시보드는 무엇이고 어떻게 들어갑니까?",
        "q_en": "What is the dashboard and how do I open it?",
        "a_ko": [
          "대시보드는 내 활동을 한곳에서 관리하는 화면입니다.",
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '대시보드'를 누릅니다.",
          "대시보드에 들어가면 왼쪽에 세로 메뉴 목록이 있습니다(휴대폰에서는 위쪽에 가로로 넘겨보는 탭으로 보입니다): 대시보드, 내 게시글, 상품 등록, 배지 신청, 내 초대 링크, 문의, 알림, 프로필, 보안, 미니 홈페이지, 코디네이터."
        ],
        "a_en": [
          "The dashboard is the screen where you manage your activity in one place.",
          "1) Open 'My Menu' (PC: the header profile photo; phone: the menu button ≡), then press 'Dashboard'.",
          "Inside the dashboard a vertical menu list sits on the left (on a phone it appears as a row of swipeable tabs at the top): Dashboard, My posts, Add a product, Apply for a badge, My referral link, Inquiries, Notifications, Profile, Security, Mini homepage, Coordinator."
        ]
      },
      {
        "q_ko": "검색은 어떻게 합니까?",
        "q_en": "How do I search?",
        "a_ko": [
          "[PC] 헤더 오른쪽의 돋보기 아이콘을 누릅니다.",
          "[휴대폰] 오른쪽 위 메뉴 버튼(≡)을 누른 뒤, 서랍 안의 검색을 누릅니다.",
          "찾을 낱말을 적으면 결과가 바로 나옵니다."
        ],
        "a_en": [
          "[PC] Press the magnifying glass icon on the right of the header.",
          "[Phone] Press the menu button (≡) at the top right, then press Search inside the drawer.",
          "Type the word you want to find and results appear right away."
        ]
      },
      {
        "q_ko": "알림은 어디에서 봅니까?",
        "q_en": "Where do I see notifications?",
        "a_ko": [
          "알림은 화면 위쪽의 종 아이콘에서 확인합니다. 새 알림이 있으면 종에 빨간 점이 표시됩니다. 종 아이콘은 PC·휴대폰 모두 상단에 있습니다.",
          "대시보드 메뉴의 '알림'에서도 전체 알림을 모아 볼 수 있습니다."
        ],
        "a_en": [
          "You see them at the bell icon on the right of the header. When there is a new notification, a dot appears on the bell.",
          "You can also see them at 'Notifications' in the dashboard's left menu."
        ]
      },
      {
        "q_ko": "게시판은 어떻게 나뉘어 있습니까?",
        "q_en": "How are the boards divided?",
        "a_ko": [
          "Commercial은 바로 사용하는 소비재 상품 게시판입니다.",
          "Industrial은 장비·부품·제조 관련 상품 게시판입니다.",
          "EPF+C(Local)은 에너지·인프라 프로젝트 게시판입니다.",
          "RFQ & ITB는 견적·입찰 등 구매요청을 등록하는 게시판입니다.",
          "※ 게시판 구성은 운영 설정에 따라 달라질 수 있으니, 실제 메뉴는 헤더(휴대폰은 메뉴 버튼 ≡ 안)에서 확인하세요."
        ],
        "a_en": [
          "Commercial is for ready-to-use consumer goods.",
          "Industrial is for equipment, parts, and manufacturing.",
          "EPF+C(Local) is for energy and infrastructure projects.",
          "RFQ & ITB is the board for posting requests (quotes and bids)."
        ]
      }
    ]
  },
  {
    "id": "selling",
    "title_ko": "상품 올리기",
    "title_en": "Posting a Product",
    "items": [
      {
        "q_ko": "상품을 어떻게 올립니까?",
        "q_en": "How do I post a product?",
        "a_ko": [
          "1) '내 메뉴'를 엽니다. PC는 헤더의 프로필 사진, 휴대폰은 오른쪽 위 메뉴 버튼(≡)입니다.",
          "2) '[만들기 > 상품 등록](/write/select)'을 누릅니다. 대시보드 왼쪽 메뉴(휴대폰은 위쪽 탭)의 '상품 등록'으로도 들어갈 수 있습니다.",
          "3) 게시판 선택 화면에서 상품 성격에 맞는 게시판을 고릅니다.",
          "4) 제목·내용·사진·사양(제품 규격)을 입력합니다.",
          "5) '등록'을 누릅니다.",
          "6) 등록한 글은 '검토 대기' 상태가 되며, 운영팀 확인 후 공개됩니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Create > Add a product](/write/select)'. (Or press 'Add a product' in the dashboard's left menu.)",
          "3) A screen to choose a board appears first. Choose the board that fits your product.",
          "4) Fill in the title, content, photos, and specs (the detailed specifications of the product).",
          "5) Press 'Register'.",
          "6) The post enters a 'Pending review' state and becomes public after the operations team checks it."
        ]
      },
      {
        "q_ko": "어느 게시판에 올려야 합니까?",
        "q_en": "Which board should I post on?",
        "a_ko": [
          "바로 사용하는 소비재는 Commercial에 등록합니다.",
          "장비·부품·제조 관련 상품은 Industrial에 등록합니다.",
          "에너지·인프라 프로젝트는 EPF+C(Local)에 등록합니다.",
          "※ 상품 등록을 시작하면 게시판 선택 화면이 먼저 나오므로, 성격에 맞는 게시판을 그때 고르면 됩니다."
        ],
        "a_en": [
          "Post ready-to-use consumer goods on Commercial.",
          "Post equipment, parts, and manufacturing items on Industrial.",
          "Post energy and infrastructure projects on EPF+C(Local)."
        ]
      },
      {
        "q_ko": "사진과 사양은 어떻게 넣습니까?",
        "q_en": "How do I add photos and specs?",
        "a_ko": [
          "상품 등록 화면의 사진 영역에 상품 사진을 올립니다. 여러 장을 등록할 수 있습니다.",
          "사양 영역에는 크기·재질·수량 등 제품의 상세 정보를 입력합니다.",
          "※ 사진과 사양이 구체적일수록 상대가 상품을 정확히 이해하고 문의로 이어질 가능성이 높습니다."
        ],
        "a_en": [
          "On the product form, upload product photos in the photo box. You can upload several.",
          "In the specs box, write detailed product information such as size, material, and quantity.",
          "The more detailed your photos and specs, the better others understand the product."
        ]
      },
      {
        "q_ko": "지금 다 못 채웠습니다. 나중에 이어서 쓸 수 있습니까?",
        "q_en": "I can't finish now. Can I continue later?",
        "a_ko": [
          "네. 상품 등록 화면에서 '임시저장'을 누르면 작성 중인 글이 초안으로 저장됩니다.",
          "나중에 '내 게시글'에서 초안을 다시 열어 마저 작성한 뒤 '등록'을 누르면 됩니다."
        ],
        "a_en": [
          "Yes. On the product form, press 'Save draft' to save it as a draft (a post you are still writing and have not posted yet).",
          "Open it again later, finish it, and press 'Register'."
        ]
      },
      {
        "q_ko": "'검토 대기'는 무엇이고 언제 공개됩니까?",
        "q_en": "What is 'Pending review' and when does it go public?",
        "a_ko": [
          "'등록'을 누른 글은 바로 공개되지 않고 먼저 '검토 대기' 상태가 됩니다.",
          "운영팀이 확인하여 승인하면 그때 공개됩니다. 검토 상황은 '내 게시글'에서 확인할 수 있습니다."
        ],
        "a_en": [
          "When you press 'Register', the post does not go public right away; it first enters a 'Pending review' state.",
          "After the operations team checks it and approves, the post becomes public."
        ]
      },
      {
        "q_ko": "올린 상품을 고치거나 지우고 싶습니다.",
        "q_en": "I want to edit or delete a product I posted.",
        "a_ko": [
          "1) '[내 메뉴 > 활동 > 내 게시글](/dashboard/posts)'로 들어갑니다. 대시보드 왼쪽 메뉴(휴대폰은 위쪽 탭)의 '내 게시글'로도 들어갈 수 있습니다.",
          "2) 목록에서 원하는 글을 선택합니다.",
          "3) 수정하거나 삭제합니다. 내용을 수정한 글은 다시 검토를 거칠 수 있습니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Activity > My posts](/dashboard/posts)'. (Or press 'My posts' in the dashboard's left menu.)",
          "3) Choose the post and edit or delete it."
        ]
      }
    ]
  },
  {
    "id": "requests",
    "title_ko": "요청 올리기",
    "title_en": "Posting a Request (RFQ & ITB)",
    "items": [
      {
        "q_ko": "요청은 상품과 어떻게 다릅니까?",
        "q_en": "How is a request different from a product?",
        "a_ko": [
          "상품은 내가 판매하는 물품을 소개하는 글입니다.",
          "구매요청은 내게 필요한 물품·서비스를 알리고 공급할 상대를 찾는 글로, 견적이나 입찰을 받을 때 사용합니다.",
          "구매요청은 RFQ & ITB 게시판에서 다룹니다."
        ],
        "a_en": [
          "A product is a post that shows an item you are selling.",
          "A request is a post that announces what you need and looks for someone to provide it. Use it to receive quotes or bids.",
          "Requests are handled on the RFQ & ITB board."
        ]
      },
      {
        "q_ko": "요청을 어떻게 올립니까?",
        "q_en": "How do I post a request?",
        "a_ko": [
          "1) '[내 메뉴 > 만들기 > 구매요청 등록](/write?menu=requests)'을 누릅니다. PC는 헤더 프로필 사진, 휴대폰은 메뉴 버튼(≡)에서 '내 메뉴'를 엽니다.",
          "2) 제목과 필요한 내용을 구체적으로 입력합니다.",
          "3) 마감 기한을 정하거나, 기한 없이 열어 둡니다.",
          "4) '등록'을 눌러 구매요청을 올립니다.",
          "※ 헤더의 RFQ & ITB 게시판에서 바로 작성을 시작할 수도 있습니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Create > Post a sourcing request](/write?menu=requests)'. (Or write it from the 'RFQ & ITB' board in the middle of the header.)",
          "3) Enter the title and the details of what you need.",
          "4) Set a deadline, or leave it open with no deadline.",
          "5) Register to post the request."
        ]
      },
      {
        "q_ko": "마감 기한은 꼭 정해야 합니까?",
        "q_en": "Must I set a deadline?",
        "a_ko": [
          "아니요. 마감 기한은 선택 사항입니다. 정해도 되고, 기한 없이 열어 두어도 됩니다.",
          "기한을 정하면 그 시점까지만 답변을 받고, 이후에는 마감된 요청으로 표시됩니다."
        ],
        "a_en": [
          "No. You can set a deadline, or leave it open with no deadline.",
          "If you set a deadline, you receive replies only until then."
        ]
      },
      {
        "q_ko": "요청은 어느 게시판에서 볼 수 있습니까?",
        "q_en": "Which board shows requests?",
        "a_ko": [
          "RFQ & ITB 게시판에서 확인합니다. PC는 헤더 가운데, 휴대폰은 메뉴 버튼(≡) 안에 있습니다.",
          "이 게시판에는 견적·입찰을 찾는 구매요청이 모입니다."
        ],
        "a_en": [
          "You see them on the 'RFQ & ITB' board in the middle of the header.",
          "This is where requests looking for quotes or bids are gathered."
        ]
      },
      {
        "q_ko": "올린 요청도 운영팀 확인을 받습니까?",
        "q_en": "Does my request also get an operations-team check?",
        "a_ko": [
          "네. 구매요청도 등록하면 운영팀 확인을 거친 뒤 공개됩니다.",
          "공개된 뒤에는 상대가 요청 상세 페이지의 '문의하기'로 연락할 수 있습니다."
        ],
        "a_en": [
          "Yes. When posted, a request also goes public after the operations team checks it.",
          "Once public, others can send an inquiry from the request's detail page."
        ]
      }
    ]
  },
  {
    "id": "inquiries",
    "title_ko": "문의 주고받기",
    "title_en": "Inquiries",
    "items": [
      {
        "q_ko": "문의는 어떻게 보냅니까?",
        "q_en": "How do I send an inquiry?",
        "a_ko": [
          "1) 문의하려는 상품 또는 구매요청의 상세 페이지를 엽니다. 목록에서 해당 글을 누르면 됩니다.",
          "2) 화면의 '문의하기' 버튼을 누릅니다.",
          "3) 보낼 내용을 입력하고 전송합니다."
        ],
        "a_en": [
          "1) Open the detail page of the product or request you want to ask about (the screen you see when you tap that post).",
          "2) Press the 'Send inquiry' button on the screen.",
          "3) Write your message and send it."
        ]
      },
      {
        "q_ko": "보낸 문의는 바로 상대에게 갑니까?",
        "q_en": "Does my inquiry go straight to the other person?",
        "a_ko": [
          "아니요. 보낸 문의는 운영팀이 먼저 확인합니다.",
          "확인 후 상대에게 전달하며, 전달이 어려운 경우에는 사유와 함께 반려됩니다."
        ],
        "a_en": [
          "No. The operations team checks your inquiry first.",
          "After checking, they forward it to the other person, or if it cannot be forwarded, they return it to you with a reason."
        ]
      },
      {
        "q_ko": "받은 문의와 보낸 문의는 어디에서 봅니까?",
        "q_en": "Where do I see received and sent inquiries?",
        "a_ko": [
          "1) '[내 메뉴 > 활동 > 문의 내역](/inquiries)'으로 들어갑니다. 대시보드 왼쪽 메뉴(휴대폰은 위쪽 탭)의 '문의'로도 들어갈 수 있습니다.",
          "2) 받은 문의와 보낸 문의를 한 화면에서 확인합니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Activity > Inquiries](/inquiries)'.",
          "Here you see both received and sent inquiries."
        ]
      },
      {
        "q_ko": "상대가 내 문의를 읽었는지 알 수 있습니까?",
        "q_en": "Can I tell if the other person read my inquiry?",
        "a_ko": [
          "네. 문의 내역에는 읽음 표시가 있어, 상대가 문의를 확인했는지 알 수 있습니다."
        ],
        "a_en": [
          "Yes. The inquiry list has a read receipt.",
          "When the other person reads it, you can confirm it by the read mark."
        ]
      },
      {
        "q_ko": "보낸 문의가 돌아왔습니다. 왜 그렇습니까?",
        "q_en": "My inquiry came back. Why?",
        "a_ko": [
          "운영팀이 확인한 결과 전달이 어렵다고 판단하면, 사유와 함께 문의가 반려됩니다.",
          "반려 사유를 확인하고 내용을 수정하여 다시 보낼 수 있습니다."
        ],
        "a_en": [
          "When the operations team checks an inquiry and finds it cannot be forwarded, they return it with a reason.",
          "You can read the reason, fix the message, and send it again."
        ]
      }
    ]
  },
  {
    "id": "invites",
    "title_ko": "초대하기",
    "title_en": "Inviting People",
    "items": [
      {
        "q_ko": "초대 링크는 어디에서 만듭니까?",
        "q_en": "Where do I create an invite link?",
        "a_ko": [
          "초대 링크는 '[내 초대 링크](/dashboard/invitations)' 화면에서 만듭니다. 들어가는 방법은 두 가지입니다.",
          "1) 대시보드 왼쪽 메뉴(휴대폰에서는 위쪽 탭)에서 '[내 초대 링크](/dashboard/invitations)'를 누릅니다. 또는 대시보드 본문의 '[내 초대 링크](/dashboard/invitations)' 카드에서 '관리하기'를 누릅니다.",
          "2) '받는 사람 메모'(선택)에 이름이나 회사를 적습니다. 나중에 목록에서 누구에게 보낸 링크인지 바로 알 수 있습니다.",
          "3) '초대 링크 만들기'를 누르면 링크가 아래 목록에 나타납니다.",
          "4) 그 줄의 '복사'를 눌러 받는 사람에게 보냅니다."
        ],
        "a_en": [
          "You create invite links on the '[My referral link](/dashboard/invitations)' screen. There are two ways in.",
          "1) In the dashboard's left menu (top tabs on a phone) press '[My referral link](/dashboard/invitations)'. Or, on the dashboard, press 'Manage' on the '[My referral link](/dashboard/invitations)' card.",
          "2) Add a name or company in 'Recipient note' (optional) so you can later tell which link went to whom.",
          "3) Press 'Create invitation' and the link appears in the list below.",
          "4) Press 'Copy' on that row and send it to the recipient."
        ]
      },
      {
        "q_ko": "초대는 여러 명이 쓸 수 있습니까?",
        "q_en": "Can several people use one invite?",
        "a_ko": [
          "아니요. 초대는 한 사람만 가입할 수 있는 1회용입니다.",
          "한 번 가입에 사용되면 재사용하거나 공유할 수 없으며, 사용되지 않아도 일정 기간이 지나면 자동으로 만료됩니다."
        ],
        "a_en": [
          "No. An invite is single-use and only one person can join with it.",
          "Once it is used to join, it cannot be reused or shared. It also expires automatically."
        ]
      },
      {
        "q_ko": "초대 링크를 다시 복사할 수 있습니까?",
        "q_en": "Can I copy an invite link again?",
        "a_ko": [
          "네. 아직 쓰이지 않은 초대 링크는 '[내 초대 링크](/dashboard/invitations)' 목록에서 언제든 다시 복사할 수 있습니다.",
          "1) 목록에서 해당 초대 줄을 찾습니다.",
          "2) 그 줄의 '복사'를 다시 누르면 링크가 복사됩니다. 아래의 'QR 코드'를 눌러 QR로 보낼 수도 있습니다."
        ],
        "a_en": [
          "Yes. As long as it has not been used, you can re-copy an invite link anytime from the '[My referral link](/dashboard/invitations)' list.",
          "1) Find the invite row in the list.",
          "2) Press 'Copy' on that row again to copy the link. You can also press 'QR code' below it to share it as a QR."
        ]
      },
      {
        "q_ko": "링크가 여러 개일 때 누구에게 보낸 것인지 어떻게 구분합니까?",
        "q_en": "With several links, how do I tell which one I sent to whom?",
        "a_ko": [
          "초대를 만들 때 '받는 사람 메모'에 이름이나 회사를 적어 두면 됩니다.",
          "그러면 목록의 각 줄에 그 메모가 제목처럼 표시되어, 어느 링크가 누구 것인지 한눈에 구분됩니다.",
          "메모는 나중에 목록에서 연필 아이콘을 눌러 고칠 수 있습니다."
        ],
        "a_en": [
          "When you create the invite, write a name or company in 'Recipient note'.",
          "That note then shows as the title of each row in the list, so you can tell at a glance which link belongs to whom.",
          "You can edit the note later by pressing the pencil icon on the row."
        ]
      },
      {
        "q_ko": "만든 초대 링크를 카카오톡 등으로 바로 보낼 수 있습니까?",
        "q_en": "Can I send an invite link straight to KakaoTalk or messages?",
        "a_ko": [
          "네. 휴대폰에서는 초대 줄의 '공유' 버튼을 누르면 카카오톡·문자 등 공유 화면이 바로 열립니다.",
          "PC나 공유를 지원하지 않는 브라우저에서는 '복사'를 눌러 링크를 복사한 뒤 붙여넣어 보내면 됩니다.",
          "옆의 'QR 코드'를 눌러 QR로 전달할 수도 있습니다."
        ],
        "a_en": [
          "Yes. On a phone, press the 'Share' button on the invite row to open the share sheet (KakaoTalk, Messages, and so on) right away.",
          "On a PC or a browser without share support, press 'Copy' to copy the link and paste it to send.",
          "You can also press 'QR code' next to it to share it as a QR."
        ]
      },
      {
        "q_ko": "초대한 사람이 가입했는지 어떻게 압니까?",
        "q_en": "How do I know whether an invited person joined?",
        "a_ko": [
          "'[내 초대 링크](/dashboard/invitations)' 목록에서 각 초대 줄의 상태 표시를 보면 됩니다.",
          "1) '대기중'은 아직 아무도 가입하지 않은 상태입니다.",
          "2) '가입 진행중'은 상대가 가입을 진행하고 있는 상태입니다.",
          "3) '가입완료'가 되면 가입한 회원의 UID(회원 번호)가 함께 표시됩니다."
        ],
        "a_en": [
          "Check the status shown on each invite row in the '[My referral link](/dashboard/invitations)' list.",
          "1) 'Waiting' means nobody has joined yet.",
          "2) 'Signing up' means the person is in the middle of joining.",
          "3) When it becomes 'Joined', the new member's UID (member number) is shown next to it."
        ]
      },
      {
        "q_ko": "만든 초대를 취소할 수 있습니까?",
        "q_en": "Can I cancel an invite I made?",
        "a_ko": [
          "네. 아직 사용되지 않은 초대는 취소할 수 있습니다.",
          "'[내 초대 링크](/dashboard/invitations)' 화면에서 해당 초대 줄의 취소를 누르면 됩니다. 취소는 한 번 더 확인한 뒤 처리됩니다."
        ],
        "a_en": [
          "Yes. You can cancel an invite that has not been used yet.",
          "Cancel that invite in the '[My referral link](/dashboard/invitations)' box."
        ]
      },
      {
        "q_ko": "초대에 대해 더 알고 싶습니다.",
        "q_en": "I want to know more about invites.",
        "a_ko": [
          "1) '[내 초대 링크](/dashboard/invitations)' 화면에서 제목 옆의 느낌표(!) 아이콘을 찾습니다.",
          "2) 느낌표 아이콘을 누르면 초대 링크에 대한 안내가 나옵니다."
        ],
        "a_en": [
          "1) Find the exclamation-mark (!) icon next to the title in the '[My referral link](/dashboard/invitations)' box.",
          "2) Press the exclamation-mark icon to see guidance about invites."
        ]
      }
    ]
  },
  {
    "id": "coordinator",
    "title_ko": "코디네이터",
    "title_en": "Coordinator",
    "items": [
      {
        "q_ko": "코디네이터가 누구입니까?",
        "q_en": "Who is my coordinator?",
        "a_ko": [
          "코디네이터는 운영팀(관리자)이 직접 권한을 부여한 회원입니다. 자신이 초대해 가입한 회원을 관리하고 초기 이용을 돕는 역할을 합니다.",
          "나를 초대한 회원이 코디네이터 권한을 가지고 있다면, 그 회원이 내 코디네이터가 됩니다."
        ],
        "a_en": [
          "A coordinator is a member granted coordinator authority directly by the operations team. They manage and help the members they invited get started.",
          "If the member who invited you holds coordinator authority, that member is your coordinator."
        ]
      },
      {
        "q_ko": "코디네이터에게 연락할 수 있습니까?",
        "q_en": "Can I contact my coordinator?",
        "a_ko": [
          "네. 코디네이터에게는 다이렉트 메시지(1:1 쪽지)를 보낼 수 있습니다.",
          "대시보드 메뉴의 코디네이터 메시지(다이렉트 메시지) 화면에서 궁금한 점을 직접 물어볼 수 있습니다."
        ],
        "a_en": [
          "Yes. You can send your coordinator a direct message (a one-to-one private message).",
          "Open the coordinator messages (direct message) screen from the dashboard menu and ask anything you are curious about."
        ]
      },
      {
        "q_ko": "내가 초대한 사람은 어디에서 봅니까?",
        "q_en": "Where do I see people I invited?",
        "a_ko": [
          "코디네이터 권한이 있는 회원만 자신이 초대해 가입한 회원 목록을 볼 수 있습니다.",
          "1) 대시보드에 들어갑니다.",
          "2) 왼쪽 메뉴(휴대폰은 위쪽 탭)에서 '코디네이터'를 누릅니다. 이 메뉴는 코디네이터 권한을 받은 회원에게만 표시됩니다.",
          "3) 내가 초대해 가입한 회원 목록을 확인하고 관리(다이렉트 메시지 등)합니다.",
          "※ 코디네이터 권한이 없는 일반 회원은 이 목록을 볼 수 없습니다. 대신 '[내 초대 링크](/dashboard/invitations)'에서 내가 보낸 초대별로 가입 여부(가입완료·가입자 UID)를 확인할 수 있습니다."
        ],
        "a_en": [
          "Only members with coordinator authority can see the list of members they invited.",
          "1) Go to the dashboard.",
          "2) Press 'Coordinator' in the left menu (top tabs on a phone). This menu appears only for members granted coordinator authority.",
          "3) View and manage the members you invited (direct messages, and so on).",
          "※ Regular members without coordinator authority cannot see this list. Instead, they can check each invite's status (Joined, and the new member's UID) in '[My referral link](/dashboard/invitations)'."
        ]
      },
      {
        "q_ko": "나도 코디네이터가 될 수 있습니까?",
        "q_en": "Can I become a coordinator?",
        "a_ko": [
          "코디네이터 권한은 운영팀(관리자)이 직접 부여합니다. 다른 회원을 초대했다고 해서 자동으로 코디네이터가 되지는 않습니다.",
          "권한을 받은 코디네이터는 자신이 초대해 가입한 회원 목록을 '코디네이터' 메뉴에서 보고 관리할 수 있으며, 그 회원들의 다이렉트 메시지를 받을 수 있습니다."
        ],
        "a_en": [
          "Coordinator authority is granted directly by the operations team. Inviting other members does not automatically make you a coordinator.",
          "A member granted the role can view and manage the members they invited in the 'Coordinator' menu, and can receive those members' direct messages."
        ]
      },
      {
        "q_ko": "일반 회원도 다른 사람을 추천(초대)할 수 있습니까?",
        "q_en": "Can regular members refer (invite) others too?",
        "a_ko": [
          "네. 코디네이터가 아니어도 모든 회원은 '[내 초대 링크](/dashboard/invitations)'에서 초대 링크를 만들어 다른 사람을 추천(초대)할 수 있습니다.",
          "내가 보낸 초대별로 가입 여부와 가입자 UID는 '[내 초대 링크](/dashboard/invitations)' 목록에서 확인할 수 있습니다.",
          "다만 초대해 가입한 회원들을 하나의 목록으로 모아 보고 관리하는 '코디네이터' 화면은, 운영팀이 코디네이터 권한을 부여한 회원에게만 제공됩니다."
        ],
        "a_en": [
          "Yes. Even without coordinator authority, every member can create invite links in '[My referral link](/dashboard/invitations)' to refer (invite) others.",
          "You can check each invite's status and the new member's UID in the '[My referral link](/dashboard/invitations)' list.",
          "However, the 'Coordinator' screen that gathers and manages all your referred members in one list is available only to members granted coordinator authority by the operations team."
        ]
      }
    ]
  },
  {
    "id": "social",
    "title_ko": "소셜·피드",
    "title_en": "Social & Feed",
    "items": [
      {
        "q_ko": "피드는 무엇이고 어디에 있습니까?",
        "q_en": "What is the feed and where is it?",
        "a_ko": [
          "피드(B2BB2G Network)는 회원들이 짧은 소식을 나누는 소셜 공간입니다.",
          "1) '내 메뉴'를 엽니다. PC는 헤더 프로필 사진, 휴대폰은 메뉴 버튼(≡)입니다.",
          "2) '[커뮤니티 > 피드](/feed)'를 누릅니다."
        ],
        "a_en": [
          "The feed (B2BB2G Network) is a social space for sharing short updates.",
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Community > Feed](/feed)'."
        ]
      },
      {
        "q_ko": "소식을 어떻게 올립니까?",
        "q_en": "How do I post an update?",
        "a_ko": [
          "1) 피드로 들어갑니다.",
          "2) 상단의 입력창에 짧은 소식을 작성합니다. 사진이나 해시태그(#)를 함께 넣을 수 있습니다.",
          "3) '올리기'를 눌러 게시합니다."
        ],
        "a_en": [
          "1) Go to the feed.",
          "2) Write a short update in the writing box.",
          "3) Press post to publish it."
        ]
      },
      {
        "q_ko": "좋아요·댓글·리포스트·팔로우는 무엇입니까?",
        "q_en": "What are like, comment, repost, and follow?",
        "a_ko": [
          "좋아요는 해당 글이 마음에 든다는 표시입니다.",
          "댓글은 글 아래에 남기는 짧은 답글입니다.",
          "리포스트는 다른 회원의 글을 내 피드로 다시 공유해 널리 알리는 기능입니다.",
          "팔로우는 특정 회원의 새 소식을 계속 받아 보도록 등록하는 기능입니다."
        ],
        "a_en": [
          "Like shows that you enjoyed a post.",
          "Comment is a short reply left under that post.",
          "Repost shares someone's post to your own feed to spread it.",
          "Follow registers a member so you keep receiving their new updates.",
          "A hashtag is written by putting '#' in front of a word."
        ]
      },
      {
        "q_ko": "해시태그는 어떻게 씁니까?",
        "q_en": "How do I use hashtags?",
        "a_ko": [
          "낱말 앞에 '#'을 붙여 작성합니다. 예: #신제품.",
          "같은 해시태그가 달린 글끼리 모아 볼 수 있어, 주제별로 소식을 찾기 편합니다."
        ],
        "a_en": [
          "Write a hashtag by putting '#' in front of a word. Example: #newproduct.",
          "Posts with the same hashtag can be gathered and viewed together easily."
        ]
      },
      {
        "q_ko": "불편한 회원을 차단할 수 있습니까?",
        "q_en": "Can I block a member who bothers me?",
        "a_ko": [
          "1) 차단할 회원의 글 또는 프로필을 엽니다.",
          "2) 더보기 메뉴에서 '차단'을 누릅니다.",
          "차단하면 그 회원의 소식이 내 피드에 표시되지 않습니다. 차단은 나중에 해제할 수 있습니다."
        ],
        "a_en": [
          "1) Open the post or profile of the member you want to block.",
          "2) Press 'Block' in the more menu.",
          "After blocking, that member's updates no longer appear in your feed."
        ]
      },
      {
        "q_ko": "나쁜 글을 신고할 수 있습니까?",
        "q_en": "Can I report a bad post?",
        "a_ko": [
          "1) 신고할 글 또는 회원을 엽니다.",
          "2) 더보기 메뉴에서 '신고'를 누릅니다.",
          "3) 신고 사유를 선택해 접수합니다. 접수된 신고는 운영팀이 확인해 조치합니다."
        ],
        "a_en": [
          "1) Open the post or member you want to report.",
          "2) Press 'Report' in the more menu.",
          "3) Choose the reason and send it. The operations team reviews it."
        ]
      }
    ]
  },
  {
    "id": "profile-badges",
    "title_ko": "프로필·배지",
    "title_en": "Profile & Badges",
    "items": [
      {
        "q_ko": "프로필은 어디에서 고칩니까?",
        "q_en": "Where do I edit my profile?",
        "a_ko": [
          "1) '[내 메뉴 > 계정 > 프로필](/dashboard/profile)'로 들어갑니다. 대시보드 왼쪽 메뉴(휴대폰은 위쪽 탭)의 '프로필'로도 들어갈 수 있습니다.",
          "2) '편집' 버튼을 누릅니다.",
          "3) 소개·회사 이름·프로필 사진을 수정한 뒤 '저장'을 누릅니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Account > Profile](/dashboard/profile)'. (Or press 'Profile' in the dashboard's left menu.)",
          "3) Press the 'Edit' button.",
          "4) Change your bio, company name, and profile photo, then save."
        ]
      },
      {
        "q_ko": "프로필에는 내 실명이 보입니까?",
        "q_en": "Does my profile show my real name?",
        "a_ko": [
          "다른 회원에게는 실명 대신 UID(회원 고유 번호)가 대표로 표시됩니다.",
          "소개와 회사 이름은 편집 화면에서 직접 입력한 내용만 공개됩니다."
        ],
        "a_en": [
          "Other members see your UID (unique member number) as the main identifier, not your real name.",
          "Your bio and company name show what you set on the edit screen."
        ]
      },
      {
        "q_ko": "배지는 무엇입니까?",
        "q_en": "What is a badge?",
        "a_ko": [
          "배지는 회원의 신뢰도를 보여 주는 표시입니다. 예를 들어 Verified(인증) 배지가 있습니다.",
          "배지가 있으면 상대가 더 신뢰하고 연결할 수 있습니다."
        ],
        "a_en": [
          "A badge is a mark that shows a member's trustworthiness. For example, there is a Verified badge.",
          "With a badge, others can connect with more confidence."
        ]
      },
      {
        "q_ko": "배지는 어떻게 신청합니까?",
        "q_en": "How do I apply for a badge?",
        "a_ko": [
          "1) 대시보드에 들어갑니다.",
          "2) 왼쪽 메뉴(휴대폰은 위쪽 탭)에서 '배지 신청'을 누릅니다.",
          "3) 안내에 따라 필요한 정보를 입력해 신청합니다.",
          "4) 운영팀 검토 후 배지가 부여됩니다."
        ],
        "a_en": [
          "1) Go to the dashboard.",
          "2) Press 'Apply for a badge' in the left vertical menu.",
          "3) Apply by following the guide.",
          "4) The badge is granted after the operations team reviews it."
        ]
      },
      {
        "q_ko": "배지는 신청하면 바로 받습니까?",
        "q_en": "Do I get the badge right after applying?",
        "a_ko": [
          "아니요. 신청 후 운영팀 검토를 거칩니다.",
          "검토가 완료되어 승인되면 배지가 부여되며, 프로필에 표시됩니다."
        ],
        "a_en": [
          "No. After you apply, it goes through an operations-team review.",
          "When the review is finished and approved, the badge is granted."
        ]
      }
    ]
  },
  {
    "id": "security-more",
    "title_ko": "계정·보안·기타",
    "title_en": "Account, Security & More",
    "items": [
      {
        "q_ko": "2단계 인증을 켜고 싶습니다.",
        "q_en": "I want to turn on two-step verification.",
        "a_ko": [
          "1) '[내 메뉴 > 계정 > 보안](/dashboard/security)'으로 들어갑니다. 대시보드 왼쪽 메뉴(휴대폰은 위쪽 탭)의 '보안'으로도 들어갈 수 있습니다.",
          "2) '2단계 인증'을 켭니다.",
          "3) 인증 앱(Google OTP, Authy 등 여섯 자리 코드를 생성하는 앱)으로 화면의 QR 코드를 스캔합니다.",
          "4) 인증 앱에 표시된 여섯 자리 코드를 입력해 등록을 완료합니다.",
          "※ 2단계 인증은 비밀번호 외에 한 번 더 확인하여 계정을 안전하게 보호합니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press '[Account > Security](/dashboard/security)'. (Or press 'Security' in the dashboard's left menu.)",
          "3) Turn on 'Two-step verification'.",
          "4) Enter the six-digit number (OTP) from an authenticator app (a phone app that creates OTP codes).",
          "Two-step verification protects your account by checking once more beyond your password."
        ]
      },
      {
        "q_ko": "OTP(인증) 앱을 잃어버렸거나 열 수 없습니다.",
        "q_en": "I lost my OTP (authenticator) app or cannot open it.",
        "a_ko": [
          "1) '[내 메뉴 > 계정 > 보안](/dashboard/security)'의 2단계 인증 칸에서 '인증 앱을 사용할 수 없나요?'를 누릅니다.",
          "2) '가입 이메일로 재설정 코드를 보냅니다. 계속할까요?' 확인이 나오면 '코드 보내기'를 누릅니다. (실수로 보내지 않도록 한 번 더 확인하는 단계입니다. 그만하려면 '취소'.)",
          "3) 가입한 이메일로 온 여섯 자리 재설정 코드를 입력합니다. 코드는 10분간만 유효합니다.",
          "4) 기존 인증기가 해제되면, 새 기기에서 2단계 인증을 다시 설정합니다."
        ],
        "a_en": [
          "1) In the two-step verification box of '[My Menu > Account > Security](/dashboard/security)', press \"Can't use your authenticator app?\".",
          "2) A confirmation appears (\"We will email a reset code. Continue?\") — press 'Send code'. This extra step prevents sending it by accident; press 'Cancel' to stop.",
          "3) Enter the six-digit reset code emailed to your sign-up address. The code is valid for 10 minutes only.",
          "4) Once the old authenticator is removed, set up two-step verification again on your new device."
        ]
      },
      {
        "q_ko": "앱 잠금은 무엇입니까?",
        "q_en": "What is app lock?",
        "a_ko": [
          "앱 잠금은 사이트를 열 때 이 기기에서 한 번 더 잠그는 보안 기능입니다.",
          "여섯 자리 PIN 또는 지문·Face ID로 잠금을 해제합니다. PIN은 항상 대체 수단으로 함께 동작합니다.",
          "'[내 메뉴 > 계정 > 보안](/dashboard/security)' 화면에서 켤 수 있으며, 설정한 이 기기에만 적용됩니다."
        ],
        "a_en": [
          "App lock is a feature that locks the site once more when you open it.",
          "You unlock it with a six-digit PIN (a numeric passcode) or with fingerprint or Face ID.",
          "Turn it on in the '[My Menu > Account > Security](/dashboard/security)' screen."
        ]
      },
      {
        "q_ko": "어떤 기기로 로그인했는지 보고, 특정 기기만 로그아웃할 수 있습니까?",
        "q_en": "Can I see which devices logged in, and sign out just some of them?",
        "a_ko": [
          "네. '[내 메뉴 > 계정 > 보안](/dashboard/security)'에 들어가면 화면 위쪽에 로그인한 기기 목록이 있고, 그 아래에 로그인 기록이 있습니다.",
          "특정 기기만 로그아웃하려면: 기기 목록에서 원하는 기기의 네모칸(체크박스)을 눌러 표시한 뒤 '선택한 기기 로그아웃'을 누릅니다. 지금 쓰는 기기에는 체크박스가 없어, 실수로 자기 자신을 로그아웃하지 않습니다.",
          "화면 오른쪽 위 버튼도 있습니다: '다른 기기 모두 로그아웃'은 지금 이 기기는 그대로 두고 나머지만 로그아웃하고, '모든 기기에서 로그아웃'은 이 기기까지 포함해 전부 로그아웃합니다.",
          "모르는 기기가 보이면 그 기기를 로그아웃하고 비밀번호도 바꾸십시오."
        ],
        "a_en": [
          "Yes. Go to '[My Menu > Account > Security](/dashboard/security)': the list of logged-in devices is near the top, with your login history below it.",
          "To sign out only certain devices: tick the checkbox next to each device you want, then press 'Sign out selected devices'. Your current device has no checkbox, so you cannot accidentally sign yourself out.",
          "There are also two buttons at the top right: 'Sign out other devices' keeps this device and signs out the rest, while 'Sign out everywhere' signs out every device including this one.",
          "If you see a device you do not know, sign it out and change your password too."
        ]
      },
      {
        "q_ko": "비밀번호를 바꾸고 싶습니다.",
        "q_en": "I want to change my password.",
        "a_ko": [
          "1) '[내 메뉴 > 계정 > 보안](/dashboard/security)'으로 들어갑니다.",
          "2) '비밀번호 변경'을 누릅니다.",
          "3) 새 비밀번호를 입력하고 저장합니다. 조건은 10자 이상, 영문 대문자·소문자·숫자·특수문자 각 1개 이상입니다."
        ],
        "a_en": [
          "1) Go to '[My Menu > Account > Security](/dashboard/security)'.",
          "2) Press 'Change password'.",
          "3) Enter a new password and save."
        ]
      },
      {
        "q_ko": "알림을 종류별로 끄고 켤 수 있습니까?",
        "q_en": "Can I turn notifications on and off by type?",
        "a_ko": [
          "1) 종 아이콘(PC·휴대폰 모두 화면 위쪽)을 누르거나, 대시보드 메뉴에서 '알림'을 누릅니다.",
          "2) '푸시 알림' 카드의 스위치를 켭니다. (브라우저가 알림 허용을 물으면 '허용'을 누릅니다.)",
          "3) 켜면 아래에 '카테고리별 알림' 줄이 생깁니다. 처음에는 접혀 있으니 그 줄을 눌러 펼친 뒤, 게시글·메시지·배지·소셜·멤버십을 종류별로 스위치로 끄고 켭니다."
        ],
        "a_en": [
          "1) Press the bell icon (top of the screen on both PC and phone), or press 'Notifications' in the dashboard menu.",
          "2) Turn on the switch on the 'Push notifications' card. (If the browser asks to allow notifications, press 'Allow'.)",
          "3) Once on, a 'By category' line appears below. It starts collapsed — press it to expand, then switch Posts, Messages, Badges, Social and Membership on or off individually."
        ]
      },
      {
        "q_ko": "광고성 정보 수신을 끄거나 켜고 싶습니다.",
        "q_en": "I want to turn marketing messages off or on.",
        "a_ko": [
          "1) 종 아이콘을 누르거나 대시보드 메뉴에서 '알림'을 누릅니다.",
          "2) '광고성 정보 수신' 카드의 스위치를 끄거나 켭니다.",
          "※ 가입할 때 동의하지 않았더라도 여기에서 켤 수 있고, 언제든 다시 끌 수 있습니다."
        ],
        "a_en": [
          "1) Press the bell icon in the header, or press 'Notifications' in the dashboard's left menu.",
          "2) Turn the switch on the 'Marketing messages' card off or on.",
          "Even if you did not agree at sign-up, you can enable it here — and turn it off again anytime."
        ]
      },
      {
        "q_ko": "마음에 든 상품을 저장하고 비교할 수 있습니까?",
        "q_en": "Can I save products I like and compare them?",
        "a_ko": [
          "1) 상품에서 저장(하트) 아이콘을 누릅니다.",
          "2) 저장한 상품은 '[내 메뉴 > 활동 > 저장한 상품](/dashboard/bookmarks)'에 모입니다.",
          "3) 이 화면에서 여러 상품을 선택해 사양을 나란히 비교할 수 있습니다."
        ],
        "a_en": [
          "1) Press the save (heart) icon on a product.",
          "2) Saved products go to '[My Menu > Activity > Saved products](/dashboard/bookmarks)'.",
          "3) Compare several products side by side here."
        ]
      },
      {
        "q_ko": "미니 홈페이지와 멤버십은 무엇이고, 도움은 어디에서 받습니까?",
        "q_en": "What are the mini homepage and membership, and where do I get help?",
        "a_ko": [
          "인증(Verified) 회원은 대시보드 메뉴의 '미니 홈페이지'에서 간단한 소개 페이지를 운영할 수 있습니다.",
          "인증 멤버십 정보는 [멤버십 페이지](/membership)에서 확인합니다.",
          "궁금한 점은 나를 초대해 준 코디네이터에게 다이렉트 메시지로 문의하거나, 'FAQ'와 'Notices'(공지사항)에서 안내를 확인하세요."
        ],
        "a_en": [
          "Verified members can run a simple introduction page at 'Dashboard left menu > Mini homepage'.",
          "See verified membership information on the [membership page](/membership).",
          "For questions, message your coordinator (the person who invited you) with a direct message, or check 'FAQ' and 'Notices' in the middle of the header."
        ]
      }
    ]
  }
];
