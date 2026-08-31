import api from './client';

export const getDashboardOverview = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getProjectAnalytics = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/analytics`);
  return response.data;
};
