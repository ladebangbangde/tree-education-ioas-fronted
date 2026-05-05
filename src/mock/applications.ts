export const kanbanColumns=['选校规划','文书准备','网申提交','Offer跟进','签证办理','行前准备'];
export const kanbanData={
'选校规划':[{name:'赵晴',country:'英国',term:'2026秋',owner:'Amy顾问',progress:30,alert:'待确认保底院校'},{name:'林宇晨',country:'新加坡',term:'2026秋',owner:'Sally顾问',progress:25,alert:'专业方向待定'}],
'文书准备':[{name:'陈昊然',country:'美国',term:'2026秋',owner:'Tom顾问',progress:48,alert:'PS二稿待修改'},{name:'周可欣',country:'中国香港',term:'2026秋',owner:'Mia老师',progress:42,alert:'推荐信待签字'}],
'网申提交':[{name:'王佳宁',country:'加拿大',term:'2026秋',owner:'Tom顾问',progress:66,alert:'UofT网申费待缴'},{name:'傅雨彤',country:'英国',term:'2026秋',owner:'Amy顾问',progress:71,alert:'需补充CV'}],
'Offer跟进':[{name:'郑子轩',country:'澳大利亚',term:'2026春',owner:'Sally顾问',progress:78,alert:'等待Monash结果'},{name:'蔡文博',country:'美国',term:'2026秋',owner:'Leo老师',progress:82,alert:'已获NYU面试'}],
'签证办理':[{name:'沈悦',country:'新加坡',term:'2026秋',owner:'Leo老师',progress:87,alert:'体检预约完成'},{name:'张成业',country:'英国',term:'2026秋',owner:'Amy顾问',progress:84,alert:'资金证明待更新'}],
'行前准备':[{name:'刘俊杰',country:'中国香港',term:'2026秋',owner:'Mia老师',progress:92,alert:'住宿确认中'},{name:'何诗雅',country:'加拿大',term:'2026秋',owner:'Tom顾问',progress:94,alert:'接机服务已登记'}]
};

export const appOverview={id:'APP202605001',student:'赵晴',country:'英国',targetSchools:'UCL / 曼大 / 爱丁堡',stage:'网申提交',owner:'Amy顾问'};
export const schoolRows=[{id:'SC1',school:'UCL',major:'MSc Finance',status:'已提交',deadline:'2026-01-15'},{id:'SC2',school:'曼彻斯特大学',major:'MSc Finance',status:'审理中',deadline:'2026-01-20'},{id:'SC3',school:'爱丁堡大学',major:'MSc Finance',status:'待提交',deadline:'2026-01-30'}];
export const essayRows=[{id:'E1',name:'个人陈述PS',owner:'文案-周航',status:'二稿完成',updated:'2026-05-02'},{id:'E2',name:'推荐信RL-1',owner:'导师A',status:'签字中',updated:'2026-05-04'}];
export const materialRows=[{id:'M1',name:'成绩单中英版',status:'已完成',deadline:'2026-04-12',owner:'学生'},{id:'M2',name:'在读证明',status:'待补充',deadline:'2026-05-10',owner:'学生'}];
export const nodeLogs=[{time:'2026-05-05 10:00',content:'完成曼大网申提交',owner:'申请老师-李青'},{time:'2026-05-03 14:20',content:'PS 二稿评审通过',owner:'文案-周航'}];
export const riskCards=[{title:'材料风险',level:'中',desc:'在读证明更新延迟，可能影响UCL材料完整性。'},{title:'时间风险',level:'低',desc:'整体节奏正常，保底院校提交窗口充足。'}];

export const materials=[
{id:'M01',name:'护照首页扫描件',status:'已完成',deadline:'2026-05-08',owner:'学生',remark:'清晰彩色扫描'},
{id:'M02',name:'本科成绩单',status:'待补充',deadline:'2026-05-12',owner:'教务老师',remark:'需盖章中英版'},
{id:'M03',name:'在读证明',status:'进行中',deadline:'2026-05-10',owner:'学生',remark:'学校办理中'},
{id:'M04',name:'存款证明',status:'待补充',deadline:'2026-05-20',owner:'家长',remark:'签证前必备'}
];

export const offers=[
{id:'O01',school:'UCL',major:'MSc Data Science',status:'已录取',scholarship:'£3000',resultAt:'2026-04-21',remark:'需5月内缴留位费'},
{id:'O02',school:'NYU',major:'MS CS',status:'审理中',scholarship:'-',resultAt:'-',remark:'补GRE'},
{id:'O03',school:'Monash',major:'Master of IT',status:'有条件录取',scholarship:'AU$5000',resultAt:'2026-04-30',remark:'补语言成绩'}
];

export const visaCases=[{id:'V1',student:'郑子轩',status:'资料审核中',progress:76,interview:'2026-05-18 09:30',risk:'中',preDeparture:'宿舍预定中'},{id:'V2',student:'沈悦',status:'待递签',progress:62,interview:'2026-05-28 14:00',risk:'高',preDeparture:'机票未确认'}];
