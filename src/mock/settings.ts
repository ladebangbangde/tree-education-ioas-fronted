export const users=[
{id:'U01',name:'Amy顾问',mobile:'13800112233',email:'amy@treeedu.com',role:'CONSULTANT',dept:'咨询一部',lastLogin:'2026-05-05 09:02',createdAt:'2025-07-18',enabled:true},
{id:'U02',name:'周航',mobile:'13900112244',email:'zhouhang@treeedu.com',role:'COPYWRITER',dept:'文案部',lastLogin:'2026-05-04 18:16',createdAt:'2025-05-12',enabled:true},
{id:'U03',name:'刘琪',mobile:'13700112255',email:'liuqi@treeedu.com',role:'APPLICANT_TEACHER',dept:'签证部',lastLogin:'2026-05-04 14:08',createdAt:'2025-03-22',enabled:false}
];

export const roles=['SUPER_ADMIN','OPERATOR','CONSULTANT','APPLICANT_TEACHER','COPYWRITER','AFTER_SERVICE'];

export const dictTypes=[
{name:'国家',code:'country'},{name:'渠道',code:'channel'},{name:'线索状态',code:'lead_status'},{name:'申请阶段',code:'apply_stage'},{name:'顾问擅长方向',code:'advisor_focus'}
];

export const dictItems={
country:[{id:'D1',name:'英国',code:'UK',status:'启用',sort:1,remark:'主申国家'},{id:'D2',name:'美国',code:'US',status:'启用',sort:2,remark:'Top院校占比高'}],
channel:[{id:'D3',name:'官网咨询',code:'official',status:'启用',sort:1,remark:'自然流量'},{id:'D4',name:'小红书',code:'xiaohongshu',status:'启用',sort:2,remark:'内容获客'}],
lead_status:[{id:'D5',name:'新线索',code:'new',status:'启用',sort:1,remark:'待联系'},{id:'D6',name:'高意向',code:'high',status:'启用',sort:2,remark:'重点跟进'}],
apply_stage:[{id:'D7',name:'文书准备',code:'essay',status:'启用',sort:1,remark:'文案团队交付'},{id:'D8',name:'签证办理',code:'visa',status:'启用',sort:2,remark:'签证老师负责'}],
advisor_focus:[{id:'D9',name:'商科',code:'business',status:'启用',sort:1,remark:'英港新优势方向'},{id:'D10',name:'计算机',code:'cs',status:'启用',sort:2,remark:'美加澳方向'}]
};

export const logs=[
{id:'LG01',operator:'运营管理员',module:'线索中心',type:'分配',desc:'将线索 L2026050101 分配给 Amy顾问',time:'2026-05-05 10:20',ip:'10.0.8.21',result:'成功'},
{id:'LG02',operator:'Amy顾问',module:'学生档案',type:'更新',desc:'更新赵晴档案中的文书版本',time:'2026-05-04 15:45',ip:'10.0.8.32',result:'成功'},
{id:'LG03',operator:'周航',module:'CMS文章',type:'发布',desc:'发布文章《英国硕士申请时间线》',time:'2026-05-03 11:05',ip:'10.0.8.45',result:'成功'}
];
