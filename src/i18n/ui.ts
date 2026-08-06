export type Lang = 'en' | 'ja' | 'vi';

export const langs: Lang[] = ['en', 'ja', 'vi'];

export const langLabels: Record<Lang, string> = {
  en: 'EN',
  ja: 'JA',
  vi: 'VI',
};

export const profile = {
  brandName: 'HOANGAUTOMATION',
  brandInitials: 'HAT',
  email: 'vuvnhn8@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/%E3%83%9B%E3%82%A2%E3%83%B3-%E3%83%B4%E3%83%B4%E3%82%A1%E3%83%B3-b242a7401/',
  facebookUrl: 'https://www.facebook.com/vuvnhn',
  instagramUrl: 'https://www.instagram.com/riceskrtttricemoney/',
  whatsappUrl: 'https://wa.me/817090122965',
  cvPath: '/CV/CV_VU_VAN_HOANG_EN.pdf',
  portrait: '/images/personal-11.jpg',
};

export const ui = {
  en: {
    meta: {
      title: 'Hoàng | Industrial Automation Engineer · Full Factory Automation',
      description:
        'Automation R&D Engineer pursuing full factory automation — core strengths in SCADA, PLC, and industrial AI.',
      skip: 'Skip to main content',
    },
    nav: {
      about: 'About',
      systems: 'Systems',
      caseStudies: 'Projects',
      beyond: 'Beyond Work',
      certifications: 'Skills',
      contact: 'Contact',
      downloadCv: 'Download CV',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    hero: {
      badge: 'Industrial Automation Engineer | SCADA · PLC · AI',
      greeting: "Hello, I'm",
      name: 'Hoàng',
      tagline: 'Building full factory automation with SCADA, PLC & AI.',
      headlineBefore: "Hello, I'm",
      headlineAccent: 'Hoàng',
      headlineAfter: '',
      sub:
        '3+ years in Japanese manufacturing ecosystems. Core strengths: SCADA/HMI supervision, PLC control design, and industrial AI for process optimization. Technical goal: connect field devices, control logic, and plant data into one automated system.',
      ctaPrimary: 'View Projects',
      ctaLinkedIn: 'LinkedIn',
      ctaVnw: 'VietnamWorks',
      expLabel: 'Experience',
      expValue: '3+ yrs',
      expNote: 'JP Manufacturing R&D',
      focusLabel: 'Core strengths',
      focusValue: 'SCADA · PLC · AI',
      focusNote: 'Supervise · Control · Optimize',
      goalLabel: 'Mission',
      goalValue: 'Full Auto',
      goalNote: 'End-to-end plant automation',
    },
    about: {
      kicker: 'About',
      title: 'Engineer pursuing total plant automation',
      p1:
        'I am an Automation R&D Engineer. My strongest pillars are SCADA systems, PLC programming & commissioning, and industrial AI applied to real production control — not lab-only demos.',
      p2:
        'I design closed-loop automation: sensors and I/O into PLC logic, supervised by SCADA, improved by AI models for anomaly detection, setpoint assistance, and process optimization — scaling from a cell to the full plant.',
      p3:
        'Experience in Japanese manufacturing gives me a foundation in JIS standards, high reliability, and continuous improvement — applied to real production constraints.',
      bullets: [
        'SCADA / HMI design, alarms, trends & plant overview',
        'PLC logic, interlocks, motion & line control',
        'Industrial AI for process insight & optimization',
        'Full factory automation architecture (cell → plant)',
      ],
    },
    systems: {
      kicker: 'Systems',
      title: 'Automation systems at a glance',
      subtitle:
        'The stack I focus on daily — SCADA supervision, PLC control, industrial AI loops, and full-plant architecture.',
      items: [
        {
          title: 'SCADA / HMI',
          desc: 'Realtime plant overview, KPI, alarms, and process trends for operators and engineers.',
          image: '/images/sys-scada.svg',
        },
        {
          title: 'AI + PLC Loop',
          desc: 'Sensors → AI model → PLC decisions → actuators — closed-loop control and optimization.',
          image: '/images/sys-ai-plc.svg',
        },
        {
          title: 'Robot + PLC Cell',
          desc: 'Yaskawa handling with safety zones, recipe jobs, and PLC orchestration.',
          image: '/images/sys-robot.svg',
        },
        {
          title: 'Plant Stack',
          desc: 'Field → PLC Control → SCADA → Enterprise — the ladder toward full factory automation.',
          image: '/images/sys-plant.svg',
        },
      ],
    },
    cases: {
      kicker: 'Projects',
      title: 'Technical work toward full automation',
      subtitle:
        'NDA-safe summaries. Each project framed as Problem → Solution → Impact — centered on SCADA, PLC, and AI.',
      problem: 'Problem',
      solution: 'Solution',
      impact: 'Impact',
      archLabel: 'System Architecture · NDA-safe schematic',
      diagram: 'diagram',
      items: [
        {
          id: 'cs-1',
          title: 'SCADA + AI Process Monitoring Line',
          industry: 'Process Manufacturing',
          tags: ['SCADA', 'PLC', 'Industrial AI', 'Python', 'Historian'],
          image: '/images/sys-scada.svg',
          problem:
            'Operators lacked a unified view of line health; alarms were noisy and process drifts were detected too late, causing unplanned stops.',
          solution:
            'Deployed a SCADA layer with structured tags and alarm classes, feeding an AI model that flags anomalies early and writes assist setpoints back through the PLC.',
          impact: [
            { metric: '35%', label: 'Fewer false alarms' },
            { metric: '22%', label: 'Less unplanned downtime' },
            { metric: '1 screen', label: 'Unified plant view' },
          ],
          architecture: 'Field I/O → PLC → SCADA / Historian → AI Model → PLC Setpoints',
        },
        {
          id: 'cs-2',
          title: 'PLC-Orchestrated Robot Handling Cell',
          industry: 'Electronics Manufacturing',
          tags: ['PLC', 'Yaskawa Robotics', 'SCADA', 'Safety Interlock'],
          image: '/images/sys-robot.svg',
          problem:
            'SKU changes made fixed automation uneconomical; repetitive handling limited throughput and blocked higher automation levels.',
          solution:
            'Commissioned a PLC-led cell with Yaskawa recipes, dual-zone safety, conveyor interlocks, and SCADA job status for operators.',
          impact: [
            { metric: '2.1×', label: 'Throughput uplift' },
            { metric: '0 LTI', label: 'Safety incidents' },
            { metric: '6 wks', label: 'PoC → production' },
          ],
          architecture: 'MES Recipe → SCADA → PLC → Yaskawa Controller → Gripper / Conveyor',
        },
        {
          id: 'cs-3',
          title: 'Plant-Level SCADA & PLC Standardization',
          industry: 'Multi-site Manufacturing',
          tags: ['SCADA', 'PLC Standards', 'AI Roadmap', 'MES Integration'],
          image: '/images/sys-plant.svg',
          problem:
            'Sites automated in silos; no shared SCADA tag model or PLC standard to scale AI and multi-line control across the plant network.',
          solution:
            'Defined a phased full-automation roadmap: standard PLC templates → SCADA object library → AI data hooks → multi-site rollout.',
          impact: [
            { metric: '1 plant', label: 'Reference architecture' },
            { metric: '30%', label: 'Faster pilot cycle' },
            { metric: '100%', label: 'Tech sign-off' },
          ],
          architecture: 'PLC Template → SCADA Library → AI Data Layer → Plant Rollout',
        },
      ],
    },
    beyond: {
      kicker: 'Beyond work',
      title: 'Open mind, creative hands',
      intro:
        'Outside the factory, I stay curious — sketching, road-tripping, and exploring nature. These habits keep me open-minded and feed proactive creativity back into engineering: noticing structure, detail, and better ways to solve problems.',
      mindsetTitle: 'How hobbies shape my work',
      mindset: [
        'Openness — new places and cultures sharpen cross-border collaboration',
        'Creative initiative — drawing trains observation and original problem framing',
        'Proactive energy — outdoor trips rebuild focus for deep technical work',
      ],
      gallery: [
        { src: '/images/personal-11.jpg', label: 'Exploring Japan', alt: 'Portrait by Mount Fuji' },
        { src: '/images/personal-0.jpg', label: 'Nature and seasons', alt: 'Cherry blossoms and Mount Fuji' },
        { src: '/images/personal-3.jpg', label: 'Road trips', alt: 'Autumn mountain road trip with jeep' },
        { src: '/images/personal-10.jpg', label: 'Open horizons', alt: 'Sunset on the beach' },
        { src: '/images/personal-2.jpg', label: 'Sketching architecture', alt: 'Ink drawing of a cathedral' },
        { src: '/images/personal-5.jpg', label: 'Ink study', alt: 'Ink drawing of a bird' },
        { src: '/images/personal-4.jpg', label: 'Color illustration', alt: 'Colored drawing of a house facade' },
        { src: '/images/personal-9.jpg', label: 'Urban sketches', alt: 'Pencil sketch of traditional houses' },
      ],
    },
    certs: {
      kicker: 'Credentials',
      title: 'Certifications & technical stack',
      subtitle:
        'Official licenses plus a stack built for end-to-end Smart Factory delivery — hardware, software, and standards.',
      stackTitle: 'Technical stack by domain',
      licenses: [
        {
          name: 'Japan Electrician License',
          nameJa: '電気工事士',
          issuer: 'Ministry of Health, Labour and Welfare (JP)',
          note: 'Official national electrical works qualification',
        },
        {
          name: 'Yaskawa Robot Teaching & Maintenance',
          nameJa: '安川ロボット',
          issuer: 'Yaskawa Electric',
          note: 'Teaching, operation & maintenance certification',
        },
        {
          name: 'Keyence PLC Specialist',
          nameJa: 'Keyence PLC',
          issuer: 'Keyence Corporation',
          note: 'PLC application, I/O & line control specialist',
        },
      ],
      categories: [
        {
          title: 'PLC & Control',
          accent: 'blue',
          skills: ['PLC (Keyence / Ladder / ST)', 'Interlocks & Safety', 'Servo & Motion', 'I/O Design', 'Yaskawa Robotics', 'Industrial Sensors'],
        },
        {
          title: 'SCADA & AI',
          accent: 'emerald',
          skills: ['SCADA / HMI', 'Alarm & Trend Design', 'Historian / Tags', 'Industrial AI', 'Python / C#', 'Process Optimization'],
        },
        {
          title: 'Systems & Standards',
          accent: 'violet',
          skills: ['JIS Standards', 'Full Plant Automation', 'MES Integration', 'Technical Documentation', 'PoC → Production', 'Cross-border Engineering'],
        },
      ],
    },
    contact: {
      kicker: 'Contact',
      linkedIn: 'LinkedIn',
      vnw: 'VietnamWorks',
    },
    footer: {
      tagline: 'SCADA · PLC · AI · Full factory automation.',
      about: 'About',
      caseStudies: 'Projects',
      certifications: 'Skills',
      contact: 'Contact',
    },
  },

  ja: {
    meta: {
      title: 'Hoàng | 産業自動化エンジニア · 工場全体自動化',
      description:
        '強みは SCADA・PLC・産業AI。工場全体のスマートファクトリー自動化を追求するオートメーションR&Dエンジニア。',
      skip: 'メインコンテンツへスキップ',
    },
    nav: {
      about: 'について',
      systems: 'システム',
      caseStudies: 'プロジェクト',
      beyond: '仕事の外',
      certifications: 'スキル',
      contact: '連絡',
      downloadCv: '履歴書DL',
      openMenu: 'メニューを開く',
      closeMenu: 'メニューを閉じる',
    },
    hero: {
      badge: '産業自動化エンジニア | SCADA · PLC · AI',
      greeting: 'こんにちは、',
      name: 'Hoàng です',
      tagline: 'SCADA・PLC・AI で工場全体の自動化を築きます。',
      headlineBefore: 'こんにちは、',
      headlineAccent: 'Hoàng です',
      headlineAfter: '',
      sub:
        '日本の製造現場で3年以上。強みは SCADA/HMI 監視、PLC 制御設計、プロセス最適化のための産業AI。技術目標は、フィールド機器・制御ロジック・プラントデータを一つの自動化システムとしてつなぐことです。',
      ctaPrimary: 'プロジェクトを見る',
      ctaLinkedIn: 'LinkedIn',
      ctaVnw: 'VietnamWorks',
      expLabel: '経験',
      expValue: '3年以上',
      expNote: '日本製造 R&D',
      focusLabel: 'コア強み',
      focusValue: 'SCADA · PLC · AI',
      focusNote: '監視 · 制御 · 最適化',
      goalLabel: 'ミッション',
      goalValue: '完全自動化',
      goalNote: '工場全体の自動化を追求',
    },
    about: {
      kicker: 'について',
      title: '工場全体自動化を追求するエンジニア',
      p1:
        'オートメーションR&Dエンジニアです。最大の強みは SCADA システム、PLC プログラミング／立上げ、実生産制御に適用する産業AI — ラボ限定のデモではありません。',
      p2:
        'クローズドループ自動化を設計します。センサとI/OをPLCロジックへ、SCADAで監視し、異常検知・設定支援・プロセス最適化にAIを活用。セルから工場全体へ拡張します。',
      p3:
        '日本のものづくり経験により、JIS規格、高信頼性、継続的改善の基盤を持ち、実生産の制約に即した設計を行います。',
      bullets: [
        'SCADA / HMI 設計、アラーム、トレンド、プラント概況',
        'PLCロジック、インターロック、モーション、ライン制御',
        'プロセス洞察と最適化のための産業AI',
        '工場全体自動化アーキテクチャ（セル→プラント）',
      ],
    },
    systems: {
      kicker: 'システム',
      title: '自動化システムをひと目で',
      subtitle:
        '日常のフォーカス — SCADA監視、PLC制御、産業AIループ、工場全体アーキテクチャ。',
      items: [
        {
          title: 'SCADA / HMI',
          desc: 'オペレータと技術者向けのリアルタイム概況、KPI、アラーム、トレンド。',
          image: '/images/sys-scada.svg',
        },
        {
          title: 'AI + PLC ループ',
          desc: 'センサ → AIモデル → PLC判断 → アクチュエータ。クローズドループ制御と最適化。',
          image: '/images/sys-ai-plc.svg',
        },
        {
          title: 'ロボット + PLC セル',
          desc: '安全ゾーン、ジョブレシピ、PLC連携を備えた安川ハンドリング。',
          image: '/images/sys-robot.svg',
        },
        {
          title: 'プラントスタック',
          desc: 'フィールド → PLC制御 → SCADA → エンタープライズ。工場全体自動化への梯子。',
          image: '/images/sys-plant.svg',
        },
      ],
    },
    cases: {
      kicker: 'プロジェクト',
      title: '完全自動化に向けた技術実績',
      subtitle:
        'NDAに配慮した概要。課題 → 解決 → 成果。中心は SCADA・PLC・AI。',
      problem: '課題',
      solution: '解決',
      impact: '成果',
      archLabel: 'システム構成 · NDA対応スケマティック',
      diagram: '図',
      items: [
        {
          id: 'cs-1',
          title: 'SCADA + AI プロセス監視ライン',
          industry: 'プロセス製造',
          tags: ['SCADA', 'PLC', 'Industrial AI', 'Python', 'Historian'],
          image: '/images/sys-scada.svg',
          problem:
            'ライン健全性の統一ビューがなく、アラームが過剰でプロセスドリフトの検知が遅れ、計画外停止が発生していました。',
          solution:
            '構造化タグとアラームクラスを持つSCADA層を導入。AIが早期異常を検知し、PLC経由でアシスト設定値を書き戻します。',
          impact: [
            { metric: '35%', label: '誤報アラーム削減' },
            { metric: '22%', label: '計画外停止削減' },
            { metric: '1画面', label: '統合プラントビュー' },
          ],
          architecture: 'Field I/O → PLC → SCADA / Historian → AI Model → PLC Setpoints',
        },
        {
          id: 'cs-2',
          title: 'PLC主導のロボットハンドリングセル',
          industry: '電子機器製造',
          tags: ['PLC', 'Yaskawa Robotics', 'SCADA', 'Safety Interlock'],
          image: '/images/sys-robot.svg',
          problem:
            'SKU変更が多く固定自動化が非経済的。反復ハンドリングがスループットを制限し、自動化レベルの向上を阻んでいました。',
          solution:
            '安川レシピ、二ゾーン安全、コンベアインターロック、SCADAジョブ状態を備えたPLC主導セルを立上げ。',
          impact: [
            { metric: '2.1×', label: 'スループット向上' },
            { metric: '0 LTI', label: '安全事故' },
            { metric: '6週', label: 'PoC→本番' },
          ],
          architecture: 'MES Recipe → SCADA → PLC → Yaskawa Controller → Gripper / Conveyor',
        },
        {
          id: 'cs-3',
          title: 'プラント級 SCADA & PLC 標準化',
          industry: '多拠点製造',
          tags: ['SCADA', 'PLC Standards', 'AI Roadmap', 'MES Integration'],
          image: '/images/sys-plant.svg',
          problem:
            '拠点ごとにサイロ化。AIと多ライン制御を拡張する共通SCADAタグモデル／PLC標準がありませんでした。',
          solution:
            '段階的ロードマップを定義：標準PLCテンプレート → SCADAオブジェクトライブラリ → AIデータフック → 多拠点展開。',
          impact: [
            { metric: '1工場', label: '参照アーキテクチャ' },
            { metric: '30%', label: 'パイロット短縮' },
            { metric: '100%', label: '技術承認' },
          ],
          architecture: 'PLC Template → SCADA Library → AI Data Layer → Plant Rollout',
        },
      ],
    },
    beyond: {
      kicker: '仕事の外',
      title: 'オープンな視点、創造する手',
      intro:
        '工場の外では、スケッチ・ロードトリップ・自然探索で好奇心を保っています。この習慣がオープンマインドを育て、観察力と主体的な創造性をエンジニアリングに還元します。',
      mindsetTitle: '趣味が仕事に活きる点',
      mindset: [
        'オープンさ — 新しい土地と文化が越境コラボを鋭くする',
        '創造的イニシアチブ — デッサンが観察力と問題設定を鍛える',
        '主体的なエネルギー — アウトドアが深い技術仕事への集中を回復する',
      ],
      gallery: [
        { src: '/images/personal-11.jpg', label: '日本を旅する', alt: '富士山でのポートレート' },
        { src: '/images/personal-1.jpg', label: '自然と季節', alt: '桜と富士山' },
        { src: '/images/personal-3.jpg', label: 'ロードトリップ', alt: '紅葉の山道とジープ' },
        { src: '/images/personal-10.jpg', label: '広い視野', alt: 'ビーチの夕日' },
        { src: '/images/personal-2.jpg', label: '建築スケッチ', alt: '大聖堂のペン画' },
        { src: '/images/personal-5.jpg', label: 'インク習作', alt: '鳥のペン画' },
        { src: '/images/personal-4.jpg', label: 'カラーイラスト', alt: '家の彩色画' },
        { src: '/images/personal-9.jpg', label: '街並みスケッチ', alt: '伝統家屋の鉛筆画' },
      ],
    },
    certs: {
      kicker: '資格・技術',
      title: '資格とテクニカルスタック',
      subtitle:
        '公式資格と、スマートファクトリーのエンドツーエンド構築向けスタック — ハード・ソフト・規格。',
      stackTitle: '領域別テクニカルスタック',
      licenses: [
        {
          name: '第二種電気工事士',
          nameJa: '電気工事士',
          issuer: '厚生労働省（日本）',
          note: '国家資格・電気工事',
        },
        {
          name: '安川ロボット ティーチング＆保守',
          nameJa: '安川ロボット',
          issuer: '安川電機',
          note: 'ティーチング・運転・保守認定',
        },
        {
          name: 'Keyence PLC スペシャリスト',
          nameJa: 'Keyence PLC',
          issuer: 'キーエンス',
          note: 'PLC応用・I/O・ライン制御',
        },
      ],
      categories: [
        {
          title: 'PLC & 制御',
          accent: 'blue',
          skills: ['PLC（Keyence / ラダー / ST）', 'インターロック・安全', 'サーボ・モーション', 'I/O設計', '安川ロボット', '産業用センサ'],
        },
        {
          title: 'SCADA & AI',
          accent: 'emerald',
          skills: ['SCADA / HMI', 'アラーム・トレンド設計', 'Historian / タグ', '産業AI', 'Python / C#', 'プロセス最適化'],
        },
        {
          title: 'システム & 規格',
          accent: 'violet',
          skills: ['JIS規格', '工場全体自動化', 'MES統合', '技術ドキュメント', 'PoC→本番', '国際技術連携'],
        },
      ],
    },
    contact: {
      kicker: '連絡',
      linkedIn: 'LinkedIn',
      vnw: 'VietnamWorks',
    },
    footer: {
      tagline: 'SCADA · PLC · AI · 工場全体自動化。',
      about: 'について',
      caseStudies: 'プロジェクト',
      certifications: 'スキル',
      contact: '連絡',
    },
  },

  vi: {
    meta: {
      title: 'Hoàng | Kỹ sư Tự động hóa · Tự động hóa toàn nhà máy',
      description:
        'Kỹ sư R&D tự động hóa — điểm mạnh SCADA, PLC và AI công nghiệp; theo đuổi tự động hóa toàn nhà máy.',
      skip: 'Chuyển tới nội dung chính',
    },
    nav: {
      about: 'Giới thiệu',
      systems: 'Hệ thống',
      caseStudies: 'Dự án',
      beyond: 'Ngoài công việc',
      certifications: 'Kỹ năng',
      contact: 'Liên hệ',
      downloadCv: 'Tải CV',
      openMenu: 'Mở menu',
      closeMenu: 'Đóng menu',
    },
    hero: {
      badge: 'Kỹ sư Tự động hóa Công nghiệp | SCADA · PLC · AI',
      greeting: 'Xin chào, mình là',
      name: 'Hoàng',
      tagline: 'Xây tự động hóa toàn nhà máy với SCADA, PLC & AI.',
      headlineBefore: 'Xin chào, mình là',
      headlineAccent: 'Hoàng',
      headlineAfter: '',
      sub:
        'Hơn 3 năm trong hệ sinh thái sản xuất Nhật Bản. Điểm mạnh cốt lõi: giám sát SCADA/HMI, thiết kế điều khiển PLC, và AI công nghiệp tối ưu quy trình. Mục tiêu kỹ thuật: kết nối thiết bị field, logic điều khiển và dữ liệu nhà máy thành một hệ thống tự động.',
      ctaPrimary: 'Xem dự án',
      ctaLinkedIn: 'LinkedIn',
      ctaVnw: 'VietnamWorks',
      expLabel: 'Kinh nghiệm',
      expValue: '3+ năm',
      expNote: 'R&D sản xuất JP',
      focusLabel: 'Điểm mạnh',
      focusValue: 'SCADA · PLC · AI',
      focusNote: 'Giám sát · Điều khiển · Tối ưu',
      goalLabel: 'Sứ mệnh',
      goalValue: 'Full Auto',
      goalNote: 'Tự động hóa end-to-end nhà máy',
    },
    about: {
      kicker: 'Giới thiệu',
      title: 'Kỹ sư theo đuổi tự động hóa toàn nhà máy',
      p1:
        'Tôi là Kỹ sư R&D Tự động hóa. Ba trụ cột mạnh nhất: hệ thống SCADA, lập trình & commissioning PLC, và AI công nghiệp áp dụng trên điều khiển sản xuất thật — không chỉ demo phòng lab.',
      p2:
        'Thiết kế tự động hóa vòng kín: cảm biến/I/O vào logic PLC, giám sát bằng SCADA, AI hỗ trợ phát hiện bất thường, gợi ý setpoint và tối ưu quy trình — mở rộng từ cell tới cả nhà máy.',
      p3:
        'Kinh nghiệm sản xuất Nhật Bản mang lại nền tảng JIS, độ tin cậy cao và cải tiến liên tục — áp dụng cho ràng buộc sản xuất thật.',
      bullets: [
        'SCADA / HMI: thiết kế, alarm, trend & tổng quan nhà máy',
        'PLC: logic, interlock, motion & điều khiển line',
        'AI công nghiệp cho insight & tối ưu quy trình',
        'Kiến trúc full factory automation (cell → plant)',
      ],
    },
    systems: {
      kicker: 'Hệ thống',
      title: 'Hệ thống tự động hóa trong một cái nhìn',
      subtitle:
        'Stack tôi tập trung hằng ngày — SCADA, PLC, vòng lặp AI công nghiệp và kiến trúc toàn nhà máy.',
      items: [
        {
          title: 'SCADA / HMI',
          desc: 'Tổng quan realtime, KPI, alarm và trend cho operator và kỹ sư.',
          image: '/images/sys-scada.svg',
        },
        {
          title: 'AI + PLC Loop',
          desc: 'Cảm biến → model AI → quyết định PLC → actuator — điều khiển & tối ưu vòng kín.',
          image: '/images/sys-ai-plc.svg',
        },
        {
          title: 'Robot + PLC Cell',
          desc: 'Handling Yaskawa với vùng an toàn, job recipe và điều phối PLC.',
          image: '/images/sys-robot.svg',
        },
        {
          title: 'Plant Stack',
          desc: 'Field → PLC Control → SCADA → Enterprise — nấc thang tới full factory automation.',
          image: '/images/sys-plant.svg',
        },
      ],
    },
    cases: {
      kicker: 'Dự án',
      title: 'Công việc kỹ thuật hướng tới tự động hóa toàn phần',
      subtitle:
        'Tóm tắt tuân thủ NDA. Vấn đề → Giải pháp → Tác động — trọng tâm SCADA, PLC và AI.',
      problem: 'Vấn đề',
      solution: 'Giải pháp',
      impact: 'Tác động',
      archLabel: 'Kiến trúc hệ thống · Sơ đồ an toàn NDA',
      diagram: 'sơ đồ',
      items: [
        {
          id: 'cs-1',
          title: 'Giám sát quy trình SCADA + AI',
          industry: 'Sản xuất process',
          tags: ['SCADA', 'PLC', 'Industrial AI', 'Python', 'Historian'],
          image: '/images/sys-scada.svg',
          problem:
            'Operator thiếu cái nhìn thống nhất về sức khỏe line; alarm ồn, phát hiện drift muộn gây dừng ngoài kế hoạch.',
          solution:
            'Triển khai lớp SCADA với tag có cấu trúc và phân lớp alarm; model AI báo bất thường sớm và ghi setpoint hỗ trợ về PLC.',
          impact: [
            { metric: '35%', label: 'Giảm false alarm' },
            { metric: '22%', label: 'Giảm downtime đột xuất' },
            { metric: '1 màn', label: 'Tổng quan nhà máy' },
          ],
          architecture: 'Field I/O → PLC → SCADA / Historian → AI Model → PLC Setpoints',
        },
        {
          id: 'cs-2',
          title: 'Cell handling robot điều phối bằng PLC',
          industry: 'Sản xuất điện tử',
          tags: ['PLC', 'Yaskawa Robotics', 'SCADA', 'Safety Interlock'],
          image: '/images/sys-robot.svg',
          problem:
            'SKU thay đổi liên tục khiến tự động hóa cố định kém kinh tế; handling lặp hạn chế throughput và cấp độ tự động hóa.',
          solution:
            'Commission cell do PLC dẫn dắt với recipe Yaskawa, an toàn hai vùng, interlock băng tải và trạng thái job trên SCADA.',
          impact: [
            { metric: '2.1×', label: 'Tăng throughput' },
            { metric: '0 LTI', label: 'Sự cố an toàn' },
            { metric: '6 tuần', label: 'PoC → sản xuất' },
          ],
          architecture: 'MES Recipe → SCADA → PLC → Yaskawa Controller → Gripper / Conveyor',
        },
        {
          id: 'cs-3',
          title: 'Chuẩn hóa SCADA & PLC cấp nhà máy',
          industry: 'Sản xuất đa nhà máy',
          tags: ['SCADA', 'PLC Standards', 'AI Roadmap', 'MES Integration'],
          image: '/images/sys-plant.svg',
          problem:
            'Các site tự động hóa theo silo; thiếu mô hình tag SCADA và chuẩn PLC chung để mở rộng AI và điều khiển đa line.',
          solution:
            'Lộ trình theo giai đoạn: template PLC chuẩn → thư viện object SCADA → hook dữ liệu AI → rollout đa site.',
          impact: [
            { metric: '1 NM', label: 'Kiến trúc tham chiếu' },
            { metric: '30%', label: 'Rút ngắn pilot' },
            { metric: '100%', label: 'Phê duyệt kỹ thuật' },
          ],
          architecture: 'PLC Template → SCADA Library → AI Data Layer → Plant Rollout',
        },
      ],
    },
    beyond: {
      kicker: 'Ngoài công việc',
      title: 'Tâm thế cởi mở, bàn tay sáng tạo',
      intro:
        'Ngoài nhà máy, tôi giữ sự tò mò qua vẽ tay, road trip và khám phá thiên nhiên. Thói quen này nuôi sự cởi mở và tiếp năng lượng sáng tạo chủ động cho công việc kỹ thuật: nhìn cấu trúc, chi tiết và cách giải quyết vấn đề tốt hơn.',
      mindsetTitle: 'Sở thích nuôi dưỡng công việc',
      mindset: [
        'Cởi mở — nơi chốn & văn hóa mới mài giũa hợp tác xuyên biên giới',
        'Sáng tạo chủ động — vẽ rèn quan sát và cách đặt vấn đề gốc',
        'Năng lượng chủ động — ngoài trời giúp lấy lại tập trung cho việc kỹ thuật sâu',
      ],
      gallery: [
        { src: '/images/personal-11.jpg', label: 'Khám phá Nhật Bản', alt: 'Chân dung bên núi Phú Sĩ' },
        { src: '/images/personal-1.jpg', label: 'Thiên nhiên & mùa', alt: 'Hoa anh đào và núi Phú Sĩ' },
        { src: '/images/personal-3.jpg', label: 'Road trip', alt: 'Chuyến đi núi mùa thu với xe jeep' },
        { src: '/images/personal-10.jpg', label: 'Tầm nhìn mở', alt: 'Hoàng hôn trên biển' },
        { src: '/images/personal-2.jpg', label: 'Phác thảo kiến trúc', alt: 'Tranh mực nhà thờ' },
        { src: '/images/personal-5.jpg', label: 'Nghiên cứu mực', alt: 'Tranh mực con chim' },
        { src: '/images/personal-4.jpg', label: 'Minh họa màu', alt: 'Tranh màu mặt tiền nhà' },
        { src: '/images/personal-9.jpg', label: 'Phác thảo phố', alt: 'Phác thảo bút chì nhà truyền thống' },
      ],
    },
    certs: {
      kicker: 'Chứng chỉ',
      title: 'Chứng chỉ & technical stack',
      subtitle:
        'Chứng chỉ chính thức cùng stack cho triển khai Smart Factory end-to-end — phần cứng, phần mềm và tiêu chuẩn.',
      stackTitle: 'Technical stack theo lĩnh vực',
      licenses: [
        {
          name: 'Chứng chỉ Điện công trình Nhật Bản',
          nameJa: '電気工事士',
          issuer: 'Bộ Y tế, Lao động và Phúc lợi (JP)',
          note: 'Chứng chỉ quốc gia về điện công trình',
        },
        {
          name: 'Yaskawa Robot Teaching & Maintenance',
          nameJa: '安川ロボット',
          issuer: 'Yaskawa Electric',
          note: 'Chứng nhận teaching, vận hành & bảo trì',
        },
        {
          name: 'Keyence PLC Specialist',
          nameJa: 'Keyence PLC',
          issuer: 'Keyence Corporation',
          note: 'Chuyên gia PLC, I/O & điều khiển line',
        },
      ],
      categories: [
        {
          title: 'PLC & Điều khiển',
          accent: 'blue',
          skills: ['PLC (Keyence / Ladder / ST)', 'Interlock & Safety', 'Servo & Motion', 'Thiết kế I/O', 'Yaskawa Robotics', 'Cảm biến công nghiệp'],
        },
        {
          title: 'SCADA & AI',
          accent: 'emerald',
          skills: ['SCADA / HMI', 'Alarm & Trend', 'Historian / Tags', 'Industrial AI', 'Python / C#', 'Tối ưu quy trình'],
        },
        {
          title: 'Hệ thống & Tiêu chuẩn',
          accent: 'violet',
          skills: ['Tiêu chuẩn JIS', 'Full plant automation', 'Tích hợp MES', 'Tài liệu kỹ thuật', 'PoC → Production', 'Kỹ thuật xuyên biên giới'],
        },
      ],
    },
    contact: {
      kicker: 'Liên hệ',
      linkedIn: 'LinkedIn',
      vnw: 'VietnamWorks',
    },
    footer: {
      tagline: 'SCADA · PLC · AI · Tự động hóa toàn nhà máy.',
      about: 'Giới thiệu',
      caseStudies: 'Dự án',
      certifications: 'Kỹ năng',
      contact: 'Liên hệ',
    },
  },
} as const;

export type UiDict = (typeof ui)['en'];
