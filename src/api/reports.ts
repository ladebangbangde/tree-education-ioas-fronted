import client, { unwrapResponse } from './client';

export const reportsApi = {
  async mediaOutput() {
    const res = await client.get('/reports/media-output');
    return unwrapResponse<any>(res.data);
  },
  async operatorLeads() {
    const res = await client.get('/reports/operator-leads');
    return unwrapResponse<any>(res.data);
  },
  async operatorByPackage() {
    const res = await client.get('/reports/operator/by-package');
    return unwrapResponse<any[]>(res.data);
  },
  async operatorTrend() {
    const res = await client.get('/reports/operator/trend');
    return unwrapResponse<any[]>(res.data);
  }
};
