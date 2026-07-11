// Seeds curated EPC project briefs into the linked production database.
// Usage: node scripts/seed-epc-showcase.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const REF = "ruzamxdsuddjjuqmxokf";
const password = readFileSync(".env.local", "utf8")
  .split("\n")
  .find((line) => line.startsWith("SUPABASE_DB_PASSWORD="))
  ?.slice("SUPABASE_DB_PASSWORD=".length)
  .trim();

if (!password) throw new Error("SUPABASE_DB_PASSWORD missing in .env.local");

const projects = [
  {
    titleEn: "150 MWp Solar PV + 300 MWh BESS EPC Project Brief",
    titleKo: "150MWp 태양광 + 300MWh BESS EPC 프로젝트 브리프",
    hero: "/generated/epc/solar-epc-site.jpg",
    detail: "/generated/epc/solar-bess-commissioning.jpg",
    video: "https://www.youtube.com/watch?v=h7WwvDvMRk4",
    bodyEn: `<p><strong>B2BB2G Project Desk</strong> presents an indicative EPC and IPP-ready project brief for a utility-scale solar photovoltaic plant paired with battery energy storage. The brief is designed for early partner discovery across engineering, procurement, construction, grid integration and long-term operation.</p><p><em>All capacities, schedules and commercial conditions below are reference assumptions for partner matching. They do not represent an awarded contract or a commitment by a named project owner.</em></p><h2>Reference project scope</h2><ul><li>150 MWp single-axis-tracker solar PV field</li><li>300 MWh containerized battery energy storage system</li><li>33/132 kV collector system, main substation and grid interconnection</li><li>SCADA, energy management system, performance testing and operator training</li></ul><img src="/generated/epc/solar-bess-commissioning.png" alt="Concept image of battery energy storage commissioning beside a solar plant"><h2>Partner packages under review</h2><p>Potential packages include owner’s engineering, geotechnical and topographic surveys, PV modules, trackers, inverters, power conversion systems, battery containers, transformers, HV equipment, civil balance of plant, commissioning and O&amp;M readiness.</p><h2>EPC contracting overview</h2><div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/h7WwvDvMRk4" width="560" height="315" frameborder="0" allowfullscreen></iframe></div><p>The embedded Modo Energy explainer is included as general educational context on EPC contracting. External video content remains the responsibility of its publisher.</p><h2>Expression of interest</h2><p>Suppliers and engineering firms should prepare a concise capability statement covering comparable references, proposed scope, certifications, delivery lead time, target regions and local-partner requirements.</p>`,
    bodyKo: `<p><strong>B2BB2G 프로젝트 데스크</strong>가 대규모 태양광 발전소와 배터리 에너지저장장치를 결합한 EPC·IPP 검토용 프로젝트 브리프를 소개합니다. 설계, 조달, 시공, 계통연계, 장기 운영 단계의 파트너 발굴을 위한 정보형 콘텐츠입니다.</p><p><em>아래 용량, 일정과 상업 조건은 파트너 매칭을 위한 참고 가정입니다. 특정 발주처의 낙찰 계약이나 확정 발주를 의미하지 않습니다.</em></p><h2>참고 프로젝트 범위</h2><ul><li>150MWp 단축 추적식 태양광 발전설비</li><li>300MWh 컨테이너형 배터리 에너지저장장치</li><li>33/132kV 집전계통, 주 변전소와 계통연계</li><li>SCADA, 에너지관리시스템, 성능시험과 운영자 교육</li></ul><img src="/generated/epc/solar-bess-commissioning.png" alt="태양광 발전소와 BESS 시운전 콘셉트 이미지"><h2>검토 대상 파트너 패키지</h2><p>발주자 설계, 지반·측량 조사, 모듈, 트래커, 인버터, PCS, 배터리 컨테이너, 변압기, 고압기기, 토목 BOP, 시운전과 O&amp;M 준비 패키지를 검토할 수 있습니다.</p><h2>EPC 계약 이해하기</h2><div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/h7WwvDvMRk4" width="560" height="315" frameborder="0" allowfullscreen></iframe></div><p>Modo Energy의 영상은 EPC 계약 구조에 관한 일반 교육 자료입니다. 외부 영상의 권리와 내용은 해당 게시자에게 있습니다.</p><h2>관심 표명 자료</h2><p>공급사와 엔지니어링 기업은 유사 실적, 제안 범위, 보유 인증, 납기, 대상 지역과 현지 파트너 요구사항을 포함한 간단한 역량 자료를 준비해 주세요.</p>`,
    specs: [
      ["Reference capacity", "참고 용량", "150 MWp PV + 300 MWh BESS"],
      ["Delivery model", "사업 모델", "EPC / IPP-ready"],
      ["Grid interface", "계통 연계", "33/132 kV (indicative)"],
      ["Target schedule", "목표 일정", "24–30 months from NTP"],
      ["Opportunity stage", "검토 단계", "Partner discovery / pre-FEED"],
    ],
  },
  {
    titleEn: "100 MW Green Hydrogen Electrolyzer EPC Partner Program",
    titleKo: "100MW 그린수소 수전해 EPC 파트너 프로그램",
    hero: "/generated/epc/green-hydrogen-epc.jpg",
    detail: "/generated/epc/electrolyzer-commissioning.jpg",
    video: "https://www.youtube.com/watch?v=aYBGSfzaa4c",
    bodyEn: `<p><strong>B2BB2G Project Desk</strong> is mapping EPC, technology and supply-chain partners for an indicative 100 MW green-hydrogen electrolyzer program. The concept covers renewable-power intake, treated-water systems, hydrogen processing, utilities and export-ready product handling.</p><p><em>This is a market-engagement brief using reference assumptions, not an awarded project or investment solicitation.</em></p><h2>Concept configuration</h2><ul><li>100 MW modular electrolyzer installation</li><li>Renewable power interface and power-quality systems</li><li>Water treatment, compression, drying and buffer storage</li><li>Control system, safety instrumented functions and commissioning</li></ul><img src="/generated/epc/electrolyzer-commissioning.png" alt="Concept image of an electrolyzer process hall during commissioning"><h2>Critical EPC interfaces</h2><p>Early coordination should address grid variability, water quality, electrolyzer turndown, hydrogen purity, hazardous-area classification, balance-of-plant integration, performance guarantees and spare-parts strategy.</p><h2>Technology context</h2><div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/aYBGSfzaa4c" width="560" height="315" frameborder="0" allowfullscreen></iframe></div><p>The CNBC video provides general background on green hydrogen. It is an external educational reference and does not endorse this project brief.</p><h2>Partner profile</h2><p>Priority partners include electrolyzer OEMs, EPC contractors, process licensors, electrical package suppliers, water-treatment specialists, hydrogen compression providers, safety consultants and commissioning teams.</p>`,
    bodyKo: `<p><strong>B2BB2G 프로젝트 데스크</strong>가 100MW급 그린수소 수전해 프로그램을 위한 EPC·기술·공급망 파트너를 탐색합니다. 재생에너지 전력 인입, 용수 처리, 수소 공정, 유틸리티와 제품 취급 설비를 포함하는 참고 프로젝트입니다.</p><p><em>본 자료는 참고 가정에 기반한 시장 참여용 브리프이며, 확정 발주나 투자 권유가 아닙니다.</em></p><h2>개념 구성</h2><ul><li>100MW 모듈형 수전해 설비</li><li>재생에너지 전력 연계와 전력품질 설비</li><li>용수 처리, 압축, 건조와 버퍼 저장</li><li>제어시스템, 안전계장 기능과 시운전</li></ul><img src="/generated/epc/electrolyzer-commissioning.png" alt="수전해 공정동 시운전 콘셉트 이미지"><h2>주요 EPC 인터페이스</h2><p>계통 변동성, 용수 품질, 수전해 부하 추종, 수소 순도, 방폭 구역, BOP 통합, 성능보증과 예비품 전략을 초기 단계부터 함께 검토해야 합니다.</p><h2>기술 참고 영상</h2><div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/aYBGSfzaa4c" width="560" height="315" frameborder="0" allowfullscreen></iframe></div><p>CNBC 영상은 그린수소에 관한 일반 배경 자료입니다. 외부 교육 자료이며 본 프로젝트 브리프를 보증하지 않습니다.</p><h2>대상 파트너</h2><p>수전해 OEM, EPC사, 공정 라이선서, 전기 패키지 공급사, 수처리 전문사, 수소 압축 설비사, 안전 컨설턴트와 시운전 팀을 우선 검토합니다.</p>`,
    specs: [
      ["Electrolyzer scale", "수전해 규모", "100 MW modular concept"],
      ["Power source", "전력원", "Renewable PPA / dedicated generation"],
      [
        "Product route",
        "제품 활용",
        "Industrial / mobility / derivative fuels",
      ],
      ["Delivery model", "사업 모델", "EPC + technology package"],
      ["Opportunity stage", "검토 단계", "Concept select / partner mapping"],
    ],
  },
  {
    titleEn: "500 MW-Class Combined-Cycle Power Plant EPC Readiness Brief",
    titleKo: "500MW급 복합화력발전소 EPC 준비 브리프",
    hero: "/generated/epc/ccgt-epc-site.jpg",
    detail: "/generated/epc/turbine-hall-commissioning.jpg",
    video: "https://www.youtube.com/watch?v=wqDZNJ_QYz4",
    bodyEn: `<p><strong>B2BB2G Project Desk</strong> outlines a reference EPC readiness program for a 500 MW-class combined-cycle power plant. The brief focuses on bankable scope definition, long-lead procurement, construction interfaces, commissioning and operational handover.</p><p><em>The configuration and performance figures are indicative industry assumptions for capability matching. They are not a supplier guarantee or notice to proceed.</em></p><h2>Reference plant scope</h2><ul><li>500 MW-class multi-shaft or single-shaft combined-cycle block</li><li>Gas turbine, HRSG, steam turbine and generator packages</li><li>Fuel-gas, water treatment, cooling, electrical and control systems</li><li>Switchyard, grid studies, performance testing and operator training</li></ul><img src="/generated/epc/turbine-hall-commissioning.png" alt="Concept image of turbine hall commissioning"><h2>Execution priorities</h2><p>The EPC strategy should lock major-equipment interfaces early, define owner-supplied versus contractor-supplied scope, control long-lead items, manage outage and grid-connection windows, and align reliability-run acceptance criteria.</p><h2>How combined cycle works</h2><div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/wqDZNJ_QYz4" width="560" height="315" frameborder="0" allowfullscreen></iframe></div><p>The external video is provided for general technical context. Rights and accuracy remain with the YouTube publisher.</p><h2>Requested capabilities</h2><p>Relevant partners may include EPC consortium leaders, turbine and generator package suppliers, HRSG manufacturers, electrical and I&amp;C integrators, cooling-system suppliers, civil contractors, commissioning specialists and LTSA providers.</p>`,
    bodyKo: `<p><strong>B2BB2G 프로젝트 데스크</strong>가 500MW급 복합화력발전소의 EPC 준비 프로그램을 참고 브리프로 정리했습니다. 금융조달이 가능한 범위 정의, 장납기 기자재 조달, 시공 인터페이스, 시운전과 운영 인계를 중심으로 구성했습니다.</p><p><em>설비 구성과 성능 수치는 역량 매칭을 위한 산업 참고 가정이며, 공급사 보증이나 착공지시를 의미하지 않습니다.</em></p><h2>참고 발전소 범위</h2><ul><li>500MW급 다축 또는 단축 복합화력 블록</li><li>가스터빈, HRSG, 증기터빈과 발전기 패키지</li><li>연료가스, 수처리, 냉각, 전기와 제어시스템</li><li>스위치야드, 계통 검토, 성능시험과 운영자 교육</li></ul><img src="/generated/epc/turbine-hall-commissioning.png" alt="터빈홀 시운전 콘셉트 이미지"><h2>수행 우선순위</h2><p>주기기 인터페이스를 조기에 확정하고 발주자·시공사 공급 범위를 구분하며, 장납기 품목과 계통연계 창구를 관리하고 신뢰도 운전 인수 기준을 일치시켜야 합니다.</p><h2>복합화력 작동 원리</h2><div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/wqDZNJ_QYz4" width="560" height="315" frameborder="0" allowfullscreen></iframe></div><p>외부 영상은 일반적인 기술 이해를 위한 자료이며, 권리와 내용의 정확성은 YouTube 게시자에게 있습니다.</p><h2>요청 역량</h2><p>EPC 컨소시엄 주관사, 터빈·발전기 패키지 공급사, HRSG 제작사, 전기·계장 통합사, 냉각설비사, 토목 시공사, 시운전 전문사와 LTSA 제공사가 참여할 수 있습니다.</p>`,
    specs: [
      ["Reference output", "참고 출력", "500 MW class"],
      ["Plant configuration", "플랜트 구성", "Combined-cycle, gas + steam"],
      ["Efficiency basis", "효율 기준", ">60% LHV target (indicative)"],
      ["Delivery model", "사업 모델", "Turnkey EPC / consortium"],
      ["Opportunity stage", "검토 단계", "EPC readiness / supplier mapping"],
    ],
  },
];

const client = new pg.Client({
  host: "aws-1-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  user: `postgres.${REF}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

await client.connect();
try {
  await client.query("begin");
  const menu = await client.query(
    "select id, board_type from public.menus where slug = 'epc' and is_visible = true",
  );
  const author = await client.query(
    "select id from public.profiles where is_admin = true order by uid limit 1",
  );
  if (!menu.rows[0] || !author.rows[0]) {
    throw new Error("Visible EPC menu or admin profile not found");
  }

  const titles = projects.map((project) => project.titleEn);
  await client.query(
    "delete from public.posts where menu_id = $1 and author_id = $2 and title_en = any($3::text[])",
    [menu.rows[0].id, author.rows[0].id, titles],
  );

  const inserted = [];
  for (const [index, project] of projects.entries()) {
    const post = await client.query(
      `insert into public.posts (
         menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko,
         rep_image_path, rep_video_url, reviewed_by, reviewed_at, published_at
       ) values ($1, $2, $3, 'approved', $4, $5, $6, $7, $8, $9, $2, now(), now() - ($10 * interval '1 hour'))
       returning id, title_en`,
      [
        menu.rows[0].id,
        author.rows[0].id,
        menu.rows[0].board_type,
        project.titleEn,
        project.titleKo,
        project.bodyEn.replaceAll(".png", ".jpg"),
        project.bodyKo.replaceAll(".png", ".jpg"),
        project.hero,
        project.video,
        index,
      ],
    );
    const postId = post.rows[0].id;
    await client.query(
      `insert into public.post_media (post_id, path, sort_order)
       values ($1, $2, 0), ($1, $3, 1)`,
      [postId, project.hero, project.detail],
    );
    for (const [
      sortOrder,
      [nameEn, nameKo, value],
    ] of project.specs.entries()) {
      await client.query(
        `insert into public.post_specs (post_id, name_en, name_ko, value, sort_order)
         values ($1, $2, $3, $4, $5)`,
        [postId, nameEn, nameKo, value, sortOrder],
      );
    }
    inserted.push(post.rows[0]);
  }
  await client.query("commit");
  console.log(JSON.stringify({ inserted }, null, 2));
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
