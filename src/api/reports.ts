import { mockReports } from '@/mock/mediaFlowApi';

export const reportsApi = {
  mediaOutput: () => mockReports.mediaOutput(),
  operatorLeads: () => mockReports.operatorLeads(),
  operatorByPackage: () => mockReports.operatorByPackage(),
  operatorTrend: () => mockReports.operatorTrend()
};
