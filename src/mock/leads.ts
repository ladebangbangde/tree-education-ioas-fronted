import type { LeadItem } from '@/types';
export const leadsList:LeadItem[]=[
{id:'L2026050101',studentName:'张雨菲',phone:'13800112233',intentCountry:'英国',degree:'本科升硕士',source:'小红书',score:92,status:'高意向',advisor:'Amy顾问',lastFollowAt:'2026-05-04 16:30',nextFollowAt:'2026-05-06 10:00',createdAt:'2026-05-01 10:10'},
{id:'L2026050102',studentName:'陈昊然',phone:'13988112233',intentCountry:'美国',degree:'硕士申请',source:'官网咨询',score:84,status:'跟进中',advisor:'Tom顾问',lastFollowAt:'2026-05-05 11:20',nextFollowAt:'2026-05-07 14:00',createdAt:'2026-05-01 11:40'},
{id:'L2026050103',studentName:'李思妍',phone:'13766554433',intentCountry:'新加坡',degree:'本科申请',source:'微信咨询',score:78,status:'新线索',advisor:'待分配',lastFollowAt:'-',nextFollowAt:'-',createdAt:'2026-05-02 09:30'}
];
export const followLogs=[{time:'2026-05-05 11:20',content:'电话沟通，确认目标院校偏好 UCL/曼大',owner:'Tom顾问'},{time:'2026-05-03 15:10',content:'发送背景评估问卷并指导填写',owner:'Tom顾问'}];
export const advisors=[{name:'Amy顾问',countries:'英国/澳洲',load:12,convert:95},{name:'Tom顾问',countries:'美国/加拿大',load:18,convert:88},{name:'Sally顾问',countries:'新加坡/中国香港',load:10,convert:90}];
