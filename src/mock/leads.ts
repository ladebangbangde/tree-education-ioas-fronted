import type { LeadItem } from '@/types';

export const leadsList:LeadItem[]=[
{id:'L2026050101',studentName:'张雨菲',phone:'13800112233',intentCountry:'英国',degree:'本科升硕士',source:'小红书',score:92,status:'高意向',advisor:'Amy顾问',ownerId:'U01',ownerName:'Amy顾问',createdBy:'林娜',createdRole:'OPERATOR',department:'咨询中心',position:'留学顾问',lastFollowAt:'2026-05-04 16:30',nextFollowAt:'2026-05-06 10:00',createdAt:'2026-05-01 10:10'},
{id:'L2026050102',studentName:'陈昊然',phone:'13988112233',intentCountry:'美国',degree:'硕士申请',source:'官网咨询',score:84,status:'跟进中',advisor:'Tom顾问',ownerId:'U07',ownerName:'Tom顾问',createdBy:'林娜',createdRole:'OPERATOR',department:'咨询中心',position:'留学顾问',lastFollowAt:'2026-05-05 11:20',nextFollowAt:'2026-05-07 14:00',createdAt:'2026-05-01 11:40'},
{id:'L2026050103',studentName:'李思妍',phone:'13766554433',intentCountry:'新加坡',degree:'本科申请',source:'微信咨询',score:78,status:'新线索',advisor:'待分配',ownerId:'U05',ownerName:'林娜',createdBy:'林娜',createdRole:'OPERATOR',department:'运营部',position:'运营人员',lastFollowAt:'-',nextFollowAt:'-',createdAt:'2026-05-02 09:30'}
];

export const followLogs=[
{time:'2026-05-05 11:20',content:'电话沟通，确认目标院校偏好 UCL/曼大',owner:'Tom顾问',channel:'电话',result:'高意向'},
{time:'2026-05-03 15:10',content:'发送背景评估问卷并指导填写',owner:'Tom顾问',channel:'微信',result:'待回访'},
{time:'2026-05-01 10:30',content:'首次咨询，了解申请预算与目标国家',owner:'Tom顾问',channel:'电话',result:'已预约'}
];

export const advisors=[
{name:'Amy顾问',countries:'英国/澳洲',load:12,convert:95,recentOrders:6,focus:'商科/管理'},
{name:'Tom顾问',countries:'美国/加拿大',load:18,convert:88,recentOrders:8,focus:'理工科/数据科学'},
{name:'Sally顾问',countries:'新加坡/中国香港',load:10,convert:90,recentOrders:5,focus:'商科/传媒'}
];

export const assignStats={pending:26,highIntent:8,todayAssigned:14};
export const assignRecommendation='该线索意向国家为英国且预算充足，推荐优先分配给英国方向高转化顾问 Amy。';

export const followTags=['电话','微信','面谈','邮件','已预约','待回访','高意向'];
export const followHistoryTable=[
{id:'FH01',time:'2026-05-05 11:20',method:'电话',result:'高意向',owner:'Tom顾问',summary:'确认目标院校优先级，计划本周发送方案'},
{id:'FH02',time:'2026-05-03 15:10',method:'微信',result:'待回访',owner:'Tom顾问',summary:'发送问卷并跟进材料准备情况'},
{id:'FH03',time:'2026-05-01 10:30',method:'电话',result:'已预约',owner:'Tom顾问',summary:'完成首次沟通，预约线下面谈'}
];
