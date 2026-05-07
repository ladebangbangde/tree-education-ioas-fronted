export const articleCategories=['申请干货','院校解读','签证政策','活动资讯'];
export const articles=[
{id:'A01',title:'2026英国硕士申请时间线全攻略',category:'申请干货',author:'内容运营-林娜',status:'已发布',publishAt:'2026-05-01 10:00',seo:'已优化',pv:3890},
{id:'A02',title:'NUS计算机学院热门项目解析',category:'院校解读',author:'文案老师-周航',status:'草稿',publishAt:'-',seo:'待优化',pv:0},
{id:'A03',title:'美国F1签证材料更新说明',category:'签证政策',author:'签证老师-刘琪',status:'待发布',publishAt:'2026-05-06 09:00',seo:'已优化',pv:0}
];
export const cases=[
{id:'C01',title:'双非逆袭 UCL 人机交互',country:'英国',school:'UCL',major:'HCI',status:'已发布',publishAt:'2026-04-28',advisor:'Amy顾问'},
{id:'C02',title:'跨专业拿到 NYU 数据科学',country:'美国',school:'NYU',major:'Data Science',status:'待发布',publishAt:'-',advisor:'Tom顾问'},
{id:'C03',title:'均分82 斩获 Toronto 统计学录取',country:'加拿大',school:'Toronto',major:'Statistics',status:'已发布',publishAt:'2026-05-02',advisor:'Sally顾问'}
];

export const countryConfigs=[
{id:'CC01',title:'英国留学国家页',code:'country-uk',summary:'聚合英国留学优势、热门院校、成功案例与咨询转化组件。',modules:['banner','advantages','schools','cases','faq'],seoTitle:'英国留学申请规划 - Tree Education',keywords:'英国留学,硕士申请,英国院校',status:'待发布',owner:'内容运营-林娜',updatedAt:'2026-05-06 09:30'}
];

export const schoolConfigs=[
{id:'SC01',title:'UCL 院校详情页',code:'school-ucl',summary:'展示院校介绍、热门专业、录取案例、申请要求与顾问建议。',modules:['banner','schools','cases','articles','apply-form'],seoTitle:'UCL申请要求与录取案例 - Tree Education',keywords:'UCL申请,UCL录取案例,英国院校',status:'待发布',owner:'院校研究组',updatedAt:'2026-05-06 10:10'}
];

export const mediaResources=[
{id:'M01',name:'首页 Banner - 英国申请季',type:'图片',scene:'官网首页/国家页头图',size:'2.4MB',updatedAt:'2026-05-05'},
{id:'M02',name:'顾问讲座回放',type:'视频',scene:'活动页/内容文章嵌入',size:'128MB',updatedAt:'2026-05-04'},
{id:'M03',name:'院校 Logo 素材包',type:'文件',scene:'院校库/成功案例卡片',size:'18MB',updatedAt:'2026-05-02'}
];

export const siteConfigs=[
{key:'global-seo',name:'全站 SEO 默认配置',desc:'维护默认标题、关键词、OG 信息和站点地图开关。',owner:'内容运营-林娜',status:'已启用'},
{key:'home-modules',name:'首页模块配置',desc:'配置 Banner、数据看板、顾问推荐和热门案例展示顺序。',owner:'运营管理员',status:'已启用'},
{key:'lead-form',name:'咨询表单配置',desc:'维护表单字段、渠道归因和自动分配入口。',owner:'增长运营-王琪',status:'待发布'}
];
