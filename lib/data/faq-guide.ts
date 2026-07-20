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
          "B2BB2G는 회사와 기관이 상품과 요청을 올리고 서로 연결되는 온라인 장터(인터넷 시장)입니다.",
          "팔 상품을 게시판에 올리거나, 필요한 물건·서비스를 요청으로 올려 상대를 찾습니다.",
          "모든 회원은 실명 대신 숫자로 된 UID(회원 고유 번호)로 표시됩니다."
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
          "가입은 초대 링크(다른 회원이 보내 주는 가입용 인터넷 주소)로 합니다. 사이트 설정에 따라 초대받은 사람만 가입할 수 있습니다.",
          "1) 받은 초대 링크를 눌러 가입 화면을 엽니다.",
          "2) 이메일과 사용할 비밀번호를 적습니다.",
          "3) 화면 안내에 따라 가입을 마칩니다."
        ],
        "a_en": [
          "You join with an invite link (a sign-up web address that another member sends you). Depending on site settings, only invited people can join.",
          "1) Tap the invite link you received to open the sign-up screen.",
          "2) Enter your email and the password you want to use.",
          "3) Follow the on-screen steps to finish signing up."
        ]
      },
      {
        "q_ko": "UID가 무엇입니까?",
        "q_en": "What is a UID?",
        "a_ko": [
          "UID는 회원마다 하나씩 주어지는 숫자 번호입니다. 사이트에서 회원을 구분하는 대표 표시입니다.",
          "다른 회원에게는 실명 대신 이 UID가 보입니다."
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
          "1) 사이트 첫 화면에서 로그인 화면을 엽니다.",
          "2) 가입할 때 쓴 이메일을 적습니다.",
          "3) 비밀번호를 적습니다.",
          "4) 로그인 버튼을 누릅니다."
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
          "2) 비밀번호 입력칸 아래의 재설정 링크(비밀번호를 새로 정하는 링크)를 누릅니다.",
          "3) 이메일을 적고 안내 메일을 받습니다.",
          "4) 메일 안의 링크를 눌러 새 비밀번호를 정합니다."
        ],
        "a_en": [
          "1) Open the login screen.",
          "2) Tap the reset link below the password box (the link to set a new password).",
          "3) Enter your email and receive the guide email.",
          "4) Tap the link in the email and set a new password."
        ]
      },
      {
        "q_ko": "화면 언어를 바꾸고 싶습니다.",
        "q_en": "I want to change the screen language.",
        "a_ko": [
          "1) 헤더(화면 맨 위 가로 줄) 오른쪽의 지구본 아이콘을 누릅니다.",
          "2) 원하는 언어를 고릅니다."
        ],
        "a_en": [
          "1) Press the globe icon on the right side of the header (the horizontal bar at the very top of the screen).",
          "2) Choose the language you want."
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
        "q_ko": "헤더(화면 맨 위 줄)에는 무엇이 있습니까?",
        "q_en": "What is on the header (the bar at the very top)?",
        "a_ko": [
          "헤더(화면 맨 위 가로 줄) 왼쪽에는 로고(B2BB2G)가 있습니다. 이것을 누르면 첫 화면으로 돌아갑니다.",
          "가운데에는 게시판 메뉴가 있습니다: Commercial, Industrial, EPF+C(Local), RFQ & ITB, Events, Services, Notices, FAQ.",
          "오른쪽에는 돋보기(검색), 지구본(언어 전환), 종(알림)이 있고, 로그인하면 동그란 프로필 사진이 보입니다."
        ],
        "a_en": [
          "On the left of the header (the horizontal bar at the very top) is the logo (B2BB2G). Pressing it returns you to the first page.",
          "In the middle are the board menus: Commercial, Industrial, EPF+C(Local), RFQ & ITB, Events, Services, Notices, FAQ.",
          "On the right are a magnifying glass (search), a globe (language), and a bell (notifications). After you log in, a round profile photo appears."
        ]
      },
      {
        "q_ko": "'내 메뉴'는 어디에 있고 안에 무엇이 있습니까?",
        "q_en": "Where is 'My Menu' and what is inside?",
        "a_ko": [
          "1) 로그인한 뒤 헤더 오른쪽 위의 동그란 프로필 사진을 누릅니다.",
          "2) '내 메뉴'가 열립니다.",
          "안에는 대시보드, 활동(내 게시글·문의 내역·저장한 상품), 만들기(상품 등록·요청 작성), 커뮤니티(피드), 계정(프로필·보안)이 있습니다."
        ],
        "a_en": [
          "1) After logging in, press the round profile photo at the top right of the header.",
          "2) 'My Menu' opens.",
          "Inside are Dashboard, Activity (My posts, Inquiries, Saved products), Create (Post a product, Write a request), Community (Feed), and Account (Profile, Security)."
        ]
      },
      {
        "q_ko": "대시보드는 무엇이고 어떻게 들어갑니까?",
        "q_en": "What is the dashboard and how do I open it?",
        "a_ko": [
          "대시보드는 내 활동을 한곳에서 관리하는 화면입니다(주소 /dashboard).",
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '대시보드'를 누릅니다.",
          "대시보드에 들어가면 왼쪽에 세로 메뉴 목록이 있습니다: 대시보드, 내 게시글, 상품 등록, 배지 신청, 문의, 알림, 프로필, 보안, 미니 홈페이지, 코디네이터."
        ],
        "a_en": [
          "The dashboard is the screen where you manage your activity in one place (address /dashboard).",
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Dashboard'.",
          "Inside the dashboard, a vertical menu list is on the left: Dashboard, My posts, Post a product, Apply for a badge, Inquiries, Notifications, Profile, Security, Mini homepage, Coordinator."
        ]
      },
      {
        "q_ko": "검색은 어떻게 합니까?",
        "q_en": "How do I search?",
        "a_ko": [
          "1) 헤더 오른쪽의 돋보기 아이콘을 누릅니다.",
          "2) 찾을 낱말을 적고 검색합니다."
        ],
        "a_en": [
          "1) Press the magnifying glass icon on the right of the header.",
          "2) Type the word you want to find and search."
        ]
      },
      {
        "q_ko": "알림은 어디에서 봅니까?",
        "q_en": "Where do I see notifications?",
        "a_ko": [
          "헤더 오른쪽의 종 아이콘에서 봅니다. 새 알림이 있으면 종에 점이 표시됩니다.",
          "대시보드 왼쪽 메뉴의 '알림'(주소 /notifications)에서도 볼 수 있습니다."
        ],
        "a_en": [
          "You see them at the bell icon on the right of the header. When there is a new notification, a dot appears on the bell.",
          "You can also see them at 'Notifications' in the dashboard's left menu (address /notifications)."
        ]
      },
      {
        "q_ko": "게시판은 어떻게 나뉘어 있습니까?",
        "q_en": "How are the boards divided?",
        "a_ko": [
          "Commercial은 바로 쓰는 소비재입니다.",
          "Industrial은 장비·부품·제조 관련입니다.",
          "EPF+C(Local)은 에너지·인프라 프로젝트입니다.",
          "RFQ & ITB는 요청(견적·입찰)을 올리는 게시판입니다."
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
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '만들기 > 상품 등록'을 누릅니다. (또는 대시보드 왼쪽 메뉴에서 '상품 등록'을 누릅니다.)",
          "3) 먼저 게시판을 고르는 화면이 나옵니다. 상품에 맞는 게시판을 고릅니다.",
          "4) 제목, 내용, 사진, 사양(제품의 자세한 규격)을 채웁니다.",
          "5) '등록'을 누릅니다.",
          "6) 글은 '검토 대기' 상태가 되고, 운영팀 확인 후 공개됩니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Create > Post a product'. (Or press 'Post a product' in the dashboard's left menu.)",
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
          "바로 쓰는 소비재는 Commercial에 올립니다.",
          "장비·부품·제조 관련 상품은 Industrial에 올립니다.",
          "에너지·인프라 프로젝트는 EPF+C(Local)에 올립니다."
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
          "상품 등록 화면에서 사진 넣는 칸에 상품 사진을 올립니다. 여러 장을 올릴 수 있습니다.",
          "사양 칸에는 크기, 재질, 수량 같은 제품의 자세한 정보를 적습니다.",
          "사진과 사양이 자세할수록 상대가 상품을 더 잘 이해합니다."
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
          "네. 상품 등록 화면에서 '임시저장'을 누르면 초안(아직 올리지 않은 작성 중인 글)으로 저장됩니다.",
          "나중에 다시 열어 이어서 채운 뒤 '등록'을 누릅니다."
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
          "'등록'을 누르면 글이 바로 공개되지 않고 먼저 '검토 대기' 상태가 됩니다.",
          "운영팀이 확인한 뒤 승인하면 글이 공개됩니다."
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
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '활동 > 내 게시글'을 누릅니다. (또는 대시보드 왼쪽 메뉴에서 '내 게시글'을 누릅니다.)",
          "3) 고칠 글을 골라 수정하거나 삭제합니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Activity > My posts'. (Or press 'My posts' in the dashboard's left menu.)",
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
          "상품은 내가 파는 물건을 보여 주는 글입니다.",
          "요청은 내가 필요한 물건이나 서비스를 알리고 상대를 찾는 글입니다. 견적이나 입찰을 받을 때 씁니다.",
          "요청은 RFQ & ITB 게시판에서 다룹니다."
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
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '만들기 > 요청 작성'을 누릅니다. (또는 헤더 가운데의 'RFQ & ITB' 게시판에서 작성합니다.)",
          "3) 제목과 필요한 내용을 적습니다.",
          "4) 마감 기한을 정하거나, 기한 없이 열어 둡니다.",
          "5) 등록해 요청을 올립니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Create > Write a request'. (Or write it from the 'RFQ & ITB' board in the middle of the header.)",
          "3) Enter the title and the details of what you need.",
          "4) Set a deadline, or leave it open with no deadline.",
          "5) Register to post the request."
        ]
      },
      {
        "q_ko": "마감 기한은 꼭 정해야 합니까?",
        "q_en": "Must I set a deadline?",
        "a_ko": [
          "아니요. 마감 기한을 정할 수도 있고, 기한 없이 열어 둘 수도 있습니다.",
          "기한을 정하면 그때까지만 답을 받습니다."
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
          "헤더 가운데의 'RFQ & ITB' 게시판에서 봅니다.",
          "여기에는 견적이나 입찰을 찾는 요청들이 모입니다."
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
          "네. 요청도 올리면 운영팀 확인을 거친 뒤 공개됩니다.",
          "공개된 뒤에는 상대가 요청 상세 페이지에서 문의를 보낼 수 있습니다."
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
          "1) 문의하려는 상품 또는 요청의 상세 페이지(그 글을 눌러 자세히 보는 화면)를 엽니다.",
          "2) 화면의 '문의하기' 버튼을 누릅니다.",
          "3) 보낼 내용을 적고 보냅니다."
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
          "확인 후 상대에게 전달하거나, 전달하기 어려우면 이유와 함께 돌려줍니다."
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
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '활동 > 문의 내역'을 누릅니다(주소 /inquiries).",
          "여기에서 받은 문의와 보낸 문의를 모두 봅니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Activity > Inquiries' (address /inquiries).",
          "Here you see both received and sent inquiries."
        ]
      },
      {
        "q_ko": "상대가 내 문의를 읽었는지 알 수 있습니까?",
        "q_en": "Can I tell if the other person read my inquiry?",
        "a_ko": [
          "네. 문의 내역에는 읽음 표시가 있습니다.",
          "상대가 읽으면 읽음 표시로 확인할 수 있습니다."
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
          "운영팀이 문의를 확인했을 때 전달하기 어렵다고 판단하면, 이유와 함께 문의를 돌려줍니다.",
          "돌려받은 이유를 보고 내용을 고쳐 다시 보낼 수 있습니다."
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
          "1) 대시보드(주소 /dashboard)에 들어갑니다.",
          "2) 화면 안의 'GROWTH TOOLS(성장 도구)' 칸을 찾습니다.",
          "3) 그 안의 '내 초대 링크'에서 초대 링크를 만듭니다."
        ],
        "a_en": [
          "1) Go to the dashboard (address /dashboard).",
          "2) Find the 'GROWTH TOOLS' box on the screen.",
          "3) Create the invite link at 'My referral link' inside it."
        ]
      },
      {
        "q_ko": "초대는 여러 명이 쓸 수 있습니까?",
        "q_en": "Can several people use one invite?",
        "a_ko": [
          "아니요. 초대는 한 사람만 가입할 수 있는 1회용입니다.",
          "한 번 가입에 쓰이면 다시 쓰거나 공유할 수 없습니다. 또한 자동으로 만료됩니다."
        ],
        "a_en": [
          "No. An invite is single-use and only one person can join with it.",
          "Once it is used to join, it cannot be reused or shared. It also expires automatically."
        ]
      },
      {
        "q_ko": "초대 링크를 놓쳤습니다. 다시 볼 수 있습니까?",
        "q_en": "I missed the invite link. Can I see it again?",
        "a_ko": [
          "보안을 위해 링크는 만든 직후 한 번만 보입니다.",
          "그러므로 만든 즉시 바로 복사해 두십시오.",
          "놓쳤다면 새 초대를 다시 만드십시오."
        ],
        "a_en": [
          "For security, the link is shown only once, right after you create it.",
          "So copy it immediately after creating it.",
          "If you missed it, create a new invite."
        ]
      },
      {
        "q_ko": "특정 사람에게만 초대를 쓰게 할 수 있습니까?",
        "q_en": "Can I limit an invite to a specific person?",
        "a_ko": [
          "네. 초대를 만들 때 특정 이메일로 제한할 수 있습니다.",
          "그러면 그 이메일을 가진 사람만 그 초대로 가입합니다."
        ],
        "a_en": [
          "Yes. When you create an invite, you can limit it to a specific email.",
          "Then only the person with that email can join with that invite."
        ]
      },
      {
        "q_ko": "만든 초대를 취소할 수 있습니까?",
        "q_en": "Can I cancel an invite I made?",
        "a_ko": [
          "네. 아직 쓰이지 않은 초대는 취소할 수 있습니다.",
          "'내 초대 링크' 칸에서 해당 초대를 취소하십시오."
        ],
        "a_en": [
          "Yes. You can cancel an invite that has not been used yet.",
          "Cancel that invite in the 'My referral link' box."
        ]
      },
      {
        "q_ko": "초대에 대해 더 알고 싶습니다.",
        "q_en": "I want to know more about invites.",
        "a_ko": [
          "1) '내 초대 링크' 칸에서 제목 옆의 느낌표(!) 아이콘을 찾습니다.",
          "2) 느낌표 아이콘을 누르면 초대에 대한 안내가 나옵니다."
        ],
        "a_en": [
          "1) Find the exclamation-mark (!) icon next to the title in the 'My referral link' box.",
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
          "나를 초대해 준 사람이 내 코디네이터입니다.",
          "코디네이터는 처음 사이트에 들어올 때 도움을 준 사람입니다."
        ],
        "a_en": [
          "The person who invited you is your coordinator.",
          "Your coordinator is the person who helped you enter the site at the start."
        ]
      },
      {
        "q_ko": "코디네이터에게 연락할 수 있습니까?",
        "q_en": "Can I contact my coordinator?",
        "a_ko": [
          "네. 코디네이터에게는 다이렉트 메시지(1:1로 직접 보내는 쪽지)를 보낼 수 있습니다.",
          "궁금한 점을 코디네이터에게 물어보십시오."
        ],
        "a_en": [
          "Yes. You can send your coordinator a direct message (a one-to-one private message).",
          "Ask your coordinator anything you are curious about."
        ]
      },
      {
        "q_ko": "내가 초대한 사람은 어디에서 봅니까?",
        "q_en": "Where do I see people I invited?",
        "a_ko": [
          "1) 대시보드에 들어갑니다.",
          "2) 왼쪽 세로 메뉴에서 '코디네이터'를 누릅니다.",
          "3) 내가 초대한 사람들을 여기에서 관리합니다."
        ],
        "a_en": [
          "1) Go to the dashboard.",
          "2) Press 'Coordinator' in the left vertical menu.",
          "3) Manage the people you invited here."
        ]
      },
      {
        "q_ko": "나는 누구의 코디네이터가 됩니까?",
        "q_en": "Whose coordinator do I become?",
        "a_ko": [
          "내 초대 링크로 가입한 사람에게는 내가 코디네이터가 됩니다.",
          "그 사람이 나에게 다이렉트 메시지를 보낼 수 있으므로 잘 도와주십시오."
        ],
        "a_en": [
          "You become the coordinator for anyone who joins with your invite link.",
          "That person can send you a direct message, so please help them well."
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
          "피드(B2BB2G Network)는 짧은 소식을 나누는 소셜 공간입니다.",
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '커뮤니티 > 피드'를 누릅니다(주소 /feed)."
        ],
        "a_en": [
          "The feed (B2BB2G Network) is a social space for sharing short updates.",
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Community > Feed' (address /feed)."
        ]
      },
      {
        "q_ko": "소식을 어떻게 올립니까?",
        "q_en": "How do I post an update?",
        "a_ko": [
          "1) 피드(주소 /feed)로 들어갑니다.",
          "2) 글 쓰는 칸에 짧은 소식을 적습니다.",
          "3) 올리기를 눌러 게시합니다."
        ],
        "a_en": [
          "1) Go to the feed (address /feed).",
          "2) Write a short update in the writing box.",
          "3) Press post to publish it."
        ]
      },
      {
        "q_ko": "좋아요·댓글·리포스트·팔로우는 무엇입니까?",
        "q_en": "What are like, comment, repost, and follow?",
        "a_ko": [
          "좋아요는 그 글이 마음에 든다는 표시입니다.",
          "댓글은 그 글 아래에 남기는 짧은 답글입니다.",
          "리포스트는 남의 글을 내 피드로 다시 올려 알리는 것입니다.",
          "팔로우는 어떤 회원의 새 소식을 계속 받아 보도록 등록하는 것입니다.",
          "해시태그는 낱말 앞에 '#'을 붙여 씁니다."
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
          "해시태그는 낱말 앞에 '#'을 붙여 씁니다. 예: #신제품.",
          "같은 해시태그를 붙인 글끼리 쉽게 모아 볼 수 있습니다."
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
          "1) 차단할 회원의 글이나 프로필을 엽니다.",
          "2) 더보기 메뉴에서 '차단'을 누릅니다.",
          "차단하면 그 회원의 소식이 내 피드에 보이지 않습니다."
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
          "1) 신고할 글이나 회원을 엽니다.",
          "2) 더보기 메뉴에서 '신고'를 누릅니다.",
          "3) 신고 이유를 골라 보냅니다. 운영팀이 확인합니다."
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
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '계정 > 프로필'을 누릅니다. (또는 대시보드 왼쪽 메뉴에서 '프로필'을 누릅니다.)",
          "3) '편집' 버튼을 누릅니다.",
          "4) 소개, 회사 이름, 프로필 사진을 바꾼 뒤 저장합니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Account > Profile'. (Or press 'Profile' in the dashboard's left menu.)",
          "3) Press the 'Edit' button.",
          "4) Change your bio, company name, and profile photo, then save."
        ]
      },
      {
        "q_ko": "프로필에는 내 실명이 보입니까?",
        "q_en": "Does my profile show my real name?",
        "a_ko": [
          "다른 회원에게는 실명 대신 UID(회원 고유 번호)가 대표로 보입니다.",
          "소개와 회사 이름은 내가 편집 화면에서 정한 내용이 보입니다."
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
          "배지는 회원의 신뢰를 보여 주는 표시입니다. 예를 들어 Verified 배지가 있습니다.",
          "배지가 있으면 상대가 더 믿고 연결할 수 있습니다."
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
          "2) 왼쪽 세로 메뉴에서 '배지 신청'을 누릅니다.",
          "3) 안내에 따라 신청합니다.",
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
          "아니요. 신청한 뒤 운영팀 검토를 거칩니다.",
          "검토가 끝나 승인되면 배지가 부여됩니다."
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
          "1) 헤더 오른쪽 위 프로필 사진을 눌러 '내 메뉴'를 엽니다.",
          "2) '계정 > 보안'을 누릅니다. (또는 대시보드 왼쪽 메뉴에서 '보안'을 누릅니다.)",
          "3) '2단계 인증'을 켭니다.",
          "4) 인증 앱(OTP를 만들어 주는 휴대폰 앱)에서 나온 여섯 자리 숫자(OTP)를 입력합니다.",
          "2단계 인증은 비밀번호 외에 한 번 더 확인해 계정을 지킵니다."
        ],
        "a_en": [
          "1) Press the profile photo at the top right of the header to open 'My Menu'.",
          "2) Press 'Account > Security'. (Or press 'Security' in the dashboard's left menu.)",
          "3) Turn on 'Two-step verification'.",
          "4) Enter the six-digit number (OTP) from an authenticator app (a phone app that creates OTP codes).",
          "Two-step verification protects your account by checking once more beyond your password."
        ]
      },
      {
        "q_ko": "OTP 앱을 잃어버렸습니다.",
        "q_en": "I lost my OTP app.",
        "a_ko": [
          "이메일로 받은 재설정 코드로 복구합니다.",
          "안내에 따라 재설정 코드를 넣으면 다시 2단계 인증을 설정할 수 있습니다."
        ],
        "a_en": [
          "You recover using the reset code sent to your email.",
          "Enter the reset code as guided, and you can set up two-step verification again."
        ]
      },
      {
        "q_ko": "앱 잠금은 무엇입니까?",
        "q_en": "What is app lock?",
        "a_ko": [
          "앱 잠금은 사이트를 열 때 한 번 더 잠그는 기능입니다.",
          "여섯 자리 PIN(숫자 비밀번호)이나 지문·Face ID로 잠금을 풉니다.",
          "'내 메뉴 > 계정 > 보안' 화면에서 켭니다."
        ],
        "a_en": [
          "App lock is a feature that locks the site once more when you open it.",
          "You unlock it with a six-digit PIN (a numeric passcode) or with fingerprint or Face ID.",
          "Turn it on in the 'My Menu > Account > Security' screen."
        ]
      },
      {
        "q_ko": "어떤 기기로 로그인했는지 볼 수 있습니까?",
        "q_en": "Can I see which devices logged in?",
        "a_ko": [
          "네. 보안 화면에서 신뢰 기기와 로그인 기록을 확인할 수 있습니다.",
          "모르는 기기가 있으면 비밀번호를 바꾸십시오."
        ],
        "a_en": [
          "Yes. On the security screen you can check trusted devices and login history.",
          "If you see a device you do not know, change your password."
        ]
      },
      {
        "q_ko": "비밀번호를 바꾸고 싶습니다.",
        "q_en": "I want to change my password.",
        "a_ko": [
          "1) '내 메뉴 > 계정 > 보안'으로 들어갑니다.",
          "2) '비밀번호 변경'을 누릅니다.",
          "3) 새 비밀번호를 넣고 저장합니다."
        ],
        "a_en": [
          "1) Go to 'My Menu > Account > Security'.",
          "2) Press 'Change password'.",
          "3) Enter a new password and save."
        ]
      },
      {
        "q_ko": "알림을 종류별로 끄고 켤 수 있습니까?",
        "q_en": "Can I turn notifications on and off by type?",
        "a_ko": [
          "1) 헤더의 종 아이콘을 누르거나, 대시보드 왼쪽 메뉴에서 '알림'을 누릅니다(주소 /notifications).",
          "2) 알림 설정에서 종류별로 켜고 끕니다."
        ],
        "a_en": [
          "1) Press the bell icon in the header, or press 'Notifications' in the dashboard's left menu (address /notifications).",
          "2) In notification settings, turn each type on or off."
        ]
      },
      {
        "q_ko": "마음에 든 상품을 저장하고 비교할 수 있습니까?",
        "q_en": "Can I save products I like and compare them?",
        "a_ko": [
          "1) 상품에서 찜(하트) 아이콘을 누릅니다.",
          "2) 저장한 상품은 '내 메뉴 > 활동 > 저장한 상품'(주소 /dashboard/bookmarks)에 담깁니다.",
          "3) 여기에서 여러 상품을 나란히 비교합니다."
        ],
        "a_en": [
          "1) Press the save (heart) icon on a product.",
          "2) Saved products go to 'My Menu > Activity > Saved products' (address /dashboard/bookmarks).",
          "3) Compare several products side by side here."
        ]
      },
      {
        "q_ko": "미니 홈페이지와 멤버십은 무엇이고, 도움은 어디에서 받습니까?",
        "q_en": "What are the mini homepage and membership, and where do I get help?",
        "a_ko": [
          "인증 회원은 '대시보드 왼쪽 메뉴 > 미니 홈페이지'에서 간단한 소개 페이지를 운영할 수 있습니다.",
          "인증 멤버십 정보는 멤버십 페이지(주소 /membership)에서 봅니다.",
          "궁금한 점은 나를 초대해 준 코디네이터에게 다이렉트 메시지로 물어보거나, 헤더 가운데의 'FAQ'와 'Notices'에서 안내를 확인하십시오."
        ],
        "a_en": [
          "Verified members can run a simple introduction page at 'Dashboard left menu > Mini homepage'.",
          "See verified membership information on the membership page (address /membership).",
          "For questions, message your coordinator (the person who invited you) with a direct message, or check 'FAQ' and 'Notices' in the middle of the header."
        ]
      }
    ]
  }
];
