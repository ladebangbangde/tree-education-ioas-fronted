export const users=[
{id:'U00',name:'系统超管',mobile:'13600001111',email:'admin@treeedu.com',role:'SUPER_ADMIN',department:'系统管理部',dept:'系统管理部',lastLogin:'2026-05-05 08:30',createdAt:'2025-01-01',enabled:true},
{id:'U01',name:'Amy顾问',mobile:'13800112233',email:'amy@treeedu.com',role:'CONSULTANT',department:'咨询中心',dept:'咨询中心',lastLogin:'2026-05-05 09:02',createdAt:'2025-07-18',enabled:true},
{id:'U02',name:'Mia老师',mobile:'13900112244',email:'mia@treeedu.com',role:'CONSULTANT',department:'申请交付中心',dept:'申请交付中心',lastLogin:'2026-05-04 18:16',createdAt:'2025-05-12',enabled:true},
{id:'U03',name:'周航',mobile:'13700112255',email:'zhouhang@treeedu.com',role:'CONSULTANT',department:'文案部',dept:'文案部',lastLogin:'2026-05-04 14:08',createdAt:'2025-03-22',enabled:true},
{id:'U04',name:'刘琪',mobile:'13700112256',email:'liuqi@treeedu.com',role:'CONSULTANT',department:'签证部',dept:'签证部',lastLogin:'2026-05-04 14:08',createdAt:'2025-03-22',enabled:false},
{id:'U05',name:'林娜',mobile:'13500112266',email:'linna@treeedu.com',role:'OPERATOR',department:'运营部',dept:'运营部',lastLogin:'2026-05-05 10:16',createdAt:'2025-06-12',enabled:true},
{id:'U06',name:'陈思',mobile:'13500112277',email:'chensi@treeedu.com',role:'OPERATOR',department:'运营部',dept:'运营部',lastLogin:'2026-05-05 11:12',createdAt:'2025-08-20',enabled:true}
];

export const roles=['SUPER_ADMIN','OPERATOR','CONSULTANT'];

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
{id:'LG01',operator:'林娜（运营）',module:'线索中心',type:'分配',desc:'将线索 L2026050101 分配给 Amy顾问',time:'2026-05-05 10:20',ip:'10.0.8.21',result:'成功'},
{id:'LG04',operator:'陈思（运营）',module:'CMS专题页',type:'更新',desc:'更新英国国家页推广位',time:'2026-05-05 13:20',ip:'10.0.8.28',result:'成功'},
{id:'LG02',operator:'Amy顾问',module:'学生档案',type:'更新',desc:'更新赵晴档案中的文书版本',time:'2026-05-04 15:45',ip:'10.0.8.32',result:'成功'},
{id:'LG03',operator:'周航',module:'CMS文章',type:'发布',desc:'发布文章《英国硕士申请时间线》',time:'2026-05-03 11:05',ip:'10.0.8.45',result:'成功'}
];

export const advisorProfiles=[
{id:'ADV01',name:'Amy顾问',level:'高级顾问',countries:'英国/澳洲',focus:'商科/管理',load:12,convert:95},
{id:'ADV02',name:'Tom顾问',level:'资深顾问',countries:'美国/加拿大',focus:'理工科/数据科学',load:18,convert:88},
{id:'ADV03',name:'Sally顾问',level:'高级顾问',countries:'新加坡/中国香港',focus:'商科/传媒',load:10,convert:90}
];

export const departmentTree=[
{title:'Tree Education',key:'root',children:[{title:'咨询中心',key:'consulting'},{title:'申请交付中心',key:'delivery'},{title:'文案部',key:'copywriting'},{title:'签证部',key:'visa'},{title:'运营部',key:'operation'}]}
];

export const departments=[
{id:'DEP01',name:'咨询中心',owner:'Amy顾问',members:18,status:'启用',desc:'负责英国、澳洲方向咨询转化'},
{id:'DEP02',name:'文案部',owner:'周航',members:12,status:'启用',desc:'负责申请文书与材料润色'},
{id:'DEP03',name:'签证部',owner:'刘琪',members:8,status:'启用',desc:'负责签证材料审核与递签辅导'},
{id:'DEP04',name:'运营部',owner:'林娜',members:10,status:'启用',desc:'负责内容、活动与渠道运营'}
];

export const positions=[
{id:'POS01',name:'顾问',dept:'咨询/交付业务中心',grade:'P5',permission:'线索/学生/申请/内容协作',members:56},
{id:'POS02',name:'运营',dept:'运营部',grade:'P4',permission:'CMS/渠道/运营报表',members:10},
{id:'POS03',name:'超管',dept:'系统管理部',grade:'M6',permission:'全局系统配置/审计治理',members:2}
];

export const dataPermissionScopes={
departments:['咨询中心','申请交付中心','文案部','签证部','运营部'],
modules:['线索中心','学生档案','申请交付','CMS','数据报表'],
rules:['按所属部门隔离线索与学生档案数据','跨部门协作需通过角色授权开放','敏感报表默认仅超级管理员可见']
};

export const menuPermissionTree=[
{title:'工作台',key:'dashboard'},{title:'线索中心',key:'leads',children:[{title:'线索列表',key:'leads-list'},{title:'线索分配',key:'leads-assign'}]},{title:'内容管理',key:'cms',children:[{title:'文章管理',key:'cms-articles'},{title:'成功案例',key:'cms-cases'}]},{title:'系统设置',key:'settings'}
];

export const menuPermissionRows=[
{key:'lead',module:'线索中心',view:'允许',create:'允许',edit:'允许',export:'允许'},
{key:'student',module:'学生档案',view:'允许',create:'允许',edit:'允许',export:'禁止'},
{key:'cms',module:'内容管理',view:'允许',create:'允许',edit:'允许',export:'禁止'}
];
