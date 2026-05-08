import type { AssetFile, ContentPackage, Lead, OperatorProfile, Task } from '@/types/mediaFlow';

export const operatorProfiles: OperatorProfile[] = [
  { id: 'OP01', name: '运营A-林娜', department: '运营部' },
  { id: 'OP02', name: '运营B-陈思', department: '运营部' },
  { id: 'OP03', name: '运营C-周倩', department: '运营部' }
];

export const contentPackages: ContentPackage[] = [
  {
    id: 'PKG20260506001',
    topicName: '英国硕士申请季短视频主题包',
    operatorId: 'OP01',
    operatorName: '运营A-林娜',
    folderPath: { operatorId: 'OP01', operatorName: '运营A-林娜', year: 2026, month: 5, day: 6, topicName: '英国硕士申请季短视频主题包' },
    coverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=480&q=80',
    scriptCount: 2,
    videoCount: 2,
    imageCount: 6,
    uploadStatus: 'completed',
    createdBy: '媒体账号-王悦',
    createdAt: '2026-05-06 10:12'
  },
  {
    id: 'PKG20260507002',
    topicName: '澳洲护理专业就业解读素材',
    operatorId: 'OP02',
    operatorName: '运营B-陈思',
    folderPath: { operatorId: 'OP02', operatorName: '运营B-陈思', year: 2026, month: 5, day: 7, topicName: '澳洲护理专业就业解读素材' },
    coverUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=480&q=80',
    scriptCount: 1,
    videoCount: 1,
    imageCount: 4,
    uploadStatus: 'partial_completed',
    createdBy: '媒体账号-王悦',
    createdAt: '2026-05-07 15:30'
  },
  {
    id: 'PKG20260508003',
    topicName: '新加坡商科留学预算说明',
    operatorId: 'OP03',
    operatorName: '运营C-周倩',
    folderPath: { operatorId: 'OP03', operatorName: '运营C-周倩', year: 2026, month: 5, day: 8, topicName: '新加坡商科留学预算说明' },
    coverUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=480&q=80',
    scriptCount: 1,
    videoCount: 0,
    imageCount: 3,
    uploadStatus: 'pending_upload',
    createdBy: '媒体账号-王悦',
    createdAt: '2026-05-08 09:05'
  }
];

export const assetFiles: AssetFile[] = [
  { id: 'AST01', packageId: 'PKG20260506001', fileName: '英国硕士申请季-口播脚本.docx', fileType: 'script', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 628000, previewUrl: '英国硕士申请季重点：时间线、院校梯度、语言规划与作品集准备。', uploadStatus: 'success', sortOrder: 1 },
  { id: 'AST02', packageId: 'PKG20260506001', fileName: '英国硕士申请季-小红书文案.txt', fileType: 'script', mimeType: 'text/plain', fileSize: 18800, previewUrl: '适合小红书发布的 3 段式标题、痛点和转化引导。', uploadStatus: 'success', sortOrder: 2 },
  { id: 'AST03', packageId: 'PKG20260506001', fileName: '英国硕士申请季-主视频.mp4', fileType: 'video', mimeType: 'video/mp4', fileSize: 158800000, thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=360&q=80', previewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', uploadStatus: 'success', sortOrder: 1 },
  { id: 'AST04', packageId: 'PKG20260506001', fileName: '英国硕士申请季-竖版混剪.mov', fileType: 'video', mimeType: 'video/quicktime', fileSize: 96800000, thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=360&q=80', previewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', uploadStatus: 'success', sortOrder: 2 },
  { id: 'AST05', packageId: 'PKG20260506001', fileName: '英国院校封面图.jpg', fileType: 'image', mimeType: 'image/jpeg', fileSize: 2200000, thumbnailUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=360&q=80', previewUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', uploadStatus: 'success', sortOrder: 1 },
  { id: 'AST06', packageId: 'PKG20260507002', fileName: '澳洲护理就业解读.pdf', fileType: 'script', mimeType: 'application/pdf', fileSize: 1024000, previewUrl: '澳洲护理专业注册路径、就业城市、薪资区间与移民关联说明。', uploadStatus: 'success', sortOrder: 1 },
  { id: 'AST07', packageId: 'PKG20260507002', fileName: '澳洲护理讲解视频.mp4', fileType: 'video', mimeType: 'video/mp4', fileSize: 125800000, thumbnailUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=360&q=80', previewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', uploadStatus: 'failed', sortOrder: 1 },
  { id: 'AST08', packageId: 'PKG20260507002', fileName: '护理课堂配图.png', fileType: 'image', mimeType: 'image/png', fileSize: 1800000, thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=360&q=80', previewUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80', uploadStatus: 'success', sortOrder: 1 },
  { id: 'AST09', packageId: 'PKG20260508003', fileName: '新加坡商科预算说明.txt', fileType: 'script', mimeType: 'text/plain', fileSize: 14500, previewUrl: '新加坡商科一年制硕士学费、生活费、奖学金与家庭预算建议。', uploadStatus: 'success', sortOrder: 1 },
  { id: 'AST10', packageId: 'PKG20260508003', fileName: '新加坡城市封面.jpg', fileType: 'image', mimeType: 'image/jpeg', fileSize: 2000000, thumbnailUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=360&q=80', previewUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80', uploadStatus: 'success', sortOrder: 1 }
];

export const mediaFlowTasks: Task[] = [
  { id: 'T-M-001', taskType: 'media_upload', roleType: 'media', relatedPackageId: 'PKG20260506001', assigneeId: 'MEDIA01', assigneeName: '媒体账号-王悦', status: 'success', progress: 100, createdAt: '2026-05-06 10:12', completedAt: '2026-05-06 10:26' },
  { id: 'T-M-002', taskType: 'media_upload', roleType: 'media', relatedPackageId: 'PKG20260507002', assigneeId: 'MEDIA01', assigneeName: '媒体账号-王悦', status: 'partial_success', progress: 76, errorMessage: '1 个视频文件转码失败，等待重试。', createdAt: '2026-05-07 15:30', completedAt: '2026-05-07 15:52' },
  { id: 'T-M-003', taskType: 'media_upload', roleType: 'media', relatedPackageId: 'PKG20260508003', assigneeId: 'MEDIA01', assigneeName: '媒体账号-王悦', status: 'pending_supplement', progress: 65, errorMessage: '缺少视频文件，请补充后完成入库。', createdAt: '2026-05-08 09:05' },
  { id: 'T-O-001', taskType: 'operator_lead_generate', roleType: 'operator', relatedPackageId: 'PKG20260506001', relatedLeadId: 'LD20260506001', assigneeId: 'OP01', assigneeName: '运营A-林娜', status: 'completed', progress: 100, createdAt: '2026-05-06 10:27', completedAt: '2026-05-06 14:18' },
  { id: 'T-O-002', taskType: 'operator_lead_generate', roleType: 'operator', relatedPackageId: 'PKG20260507002', assigneeId: 'OP02', assigneeName: '运营B-陈思', status: 'processing', progress: 45, createdAt: '2026-05-07 15:55' },
  { id: 'T-O-003', taskType: 'operator_lead_generate', roleType: 'operator', relatedPackageId: 'PKG20260508003', assigneeId: 'OP03', assigneeName: '运营C-周倩', status: 'pending', progress: 0, createdAt: '2026-05-08 09:15' }
];

export const mediaFlowLeads: Lead[] = [
  { id: 'LEAD01', leadNo: 'LD20260506001', sourceType: 'content_package', relatedPackageId: 'PKG20260506001', operatorId: 'OP01', studentName: '张雨菲', phone: '13800112233', wechat: 'zyf_uk2026', sourceChannel: '小红书', targetCountry: '英国', targetMajor: '商科管理', budget: '40-60万', degreeLevel: '本科升硕士', status: 'assigned', assignedTo: 'ADV01', assignedToName: 'Amy顾问', createdAt: '2026-05-06 14:18', updatedAt: '2026-05-07 10:20', remark: '由英国硕士申请季素材转化，已分配顾问跟进。' },
  { id: 'LEAD02', leadNo: 'LD20260507002', sourceType: 'content_package', relatedPackageId: 'PKG20260507002', operatorId: 'OP02', studentName: '陈昊然', phone: '13988112233', wechat: 'chenhr_au', sourceChannel: '视频号', targetCountry: '澳洲', targetMajor: '护理', budget: '30-50万', degreeLevel: '高中升本科', status: 'unassigned', assignedTo: '', assignedToName: '待分配', createdAt: '2026-05-07 17:40', updatedAt: '2026-05-07 17:40', remark: '看完护理专业视频后留资。' },
  { id: 'LEAD03', leadNo: 'LD20260508003', sourceType: 'content_package', relatedPackageId: 'PKG20260508003', operatorId: 'OP03', studentName: '李思妍', phone: '13766554433', wechat: 'lsy_sg', sourceChannel: '官网表单', targetCountry: '新加坡', targetMajor: '金融', budget: '25-40万', degreeLevel: '本科升硕士', status: 'completed', assignedTo: 'ADV03', assignedToName: 'Sally顾问', createdAt: '2026-05-08 11:05', updatedAt: '2026-05-08 16:30', remark: '已完成首轮方案沟通。' }
];
