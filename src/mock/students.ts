export const students=[
{id:'S202605001',name:'赵晴',gender:'女',birthday:'2002-03-16',phone:'13811002233',email:'zhaoqing@edu.com',country:'英国',stage:'网申提交',advisor:'Amy顾问',ownerId:'U01',ownerName:'Amy顾问',createdBy:'Amy顾问',createdRole:'CONSULTANT',department:'咨询中心',term:'2026秋季',status:'申请中',university:'北京外国语大学',major:'金融学',gpa:'3.7/4.0',ielts:'7.0',budget:'50-70万',target:'商科/金融分析',updatedAt:'2026-05-05'},
{id:'S202605002',name:'王佳宁',gender:'男',birthday:'2001-11-09',phone:'13922223333',email:'wangjn@edu.com',country:'加拿大',stage:'Offer跟进',advisor:'Tom顾问',ownerId:'U07',ownerName:'Tom顾问',createdBy:'Tom顾问',createdRole:'CONSULTANT',department:'咨询中心',term:'2026秋季',status:'申请中',university:'上海财经大学',major:'统计学',gpa:'3.5/4.0',ielts:'6.5',budget:'45-60万',target:'数据科学',updatedAt:'2026-05-04'},
{id:'S202605003',name:'郑子轩',gender:'男',birthday:'2002-07-24',phone:'13766668888',email:'zhengzx@edu.com',country:'澳大利亚',stage:'签证办理',advisor:'Sally顾问',ownerId:'U08',ownerName:'刘琪',createdBy:'Sally顾问',createdRole:'CONSULTANT',department:'签证部',term:'2026春季',status:'已签约',university:'华南理工大学',major:'计算机科学',gpa:'3.4/4.0',ielts:'6.5',budget:'40-55万',target:'计算机',updatedAt:'2026-05-03'}
];

export const studentBackground={
education:['北京外国语大学 金融学 本科 2019-2023','GPA 3.7/4.0，核心课程：公司金融、计量经济学'],
internships:['德勤审计部实习（2022.07-2022.10）','招商银行总行风控实习（2023.02-2023.05）'],
research:['校级科研：ESG对企业估值影响研究，负责数据建模'],
awards:['全国大学生英语竞赛二等奖','校级优秀毕业生'],
notes:'家庭支持良好，留学目标明确，时间配合度高。'
};

export const studentPlan={
countryPlan:'英国主申 + 新加坡补充',
majorDirection:'金融分析 / 商业分析',
schoolTier:'冲刺2所、主申4所、保底2所',
schools:{sprint:['UCL MSc Finance','LSE MSc Finance'],main:['曼彻斯特大学 MSc Finance','爱丁堡大学 MSc Finance','华威大学 MSc Business Analytics','KCL MSc Finance'],safe:['伯明翰大学 MSc Finance','利兹大学 MSc Finance']}
};

export const studentContract={signAt:'2026-01-15',pkg:'硕士全程申请VIP套餐',amount:'¥86,000',paymentNodes:['签约支付 40%','文书提交支付 40%','拿到首个Offer支付 20%'],paymentStatus:'已支付 80%'};

export const studentMaterials=[
{id:'SM01',name:'护照首页',status:'已完成',deadline:'2026-03-12',owner:'学生',remark:'彩色扫描件'},
{id:'SM02',name:'本科成绩单（中英）',status:'已完成',deadline:'2026-03-18',owner:'教务老师',remark:'已盖章'},
{id:'SM03',name:'在读证明',status:'待补充',deadline:'2026-05-10',owner:'学生',remark:'需学校开具新版'},
{id:'SM04',name:'推荐信2封',status:'进行中',deadline:'2026-05-20',owner:'文案老师',remark:'第2封待导师签字'}
];

export const studentFollowRecords=[
{time:'2026-05-05 11:00',content:'确认主申院校名单，补充KCL商科项目',owner:'Amy顾问'},
{time:'2026-05-02 16:20',content:'沟通推荐信安排，明确导师签字时间',owner:'文案老师-周航'},
{time:'2026-04-28 10:00',content:'完成背景深度访谈并更新选校策略',owner:'Amy顾问'}
];

export const studentTodos=['5月8日前提交在读证明新版','5月12日完成KCL项目文书终稿','5月15日安排第3次进度复盘会议'];
