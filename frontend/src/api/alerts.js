import api from './client';

export const listProjectAlerts = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/alerts`);
  return response.data;
};

export const markAlertAsRead = async (alertId) => {
  const response = await api.patch(`/alerts/${alertId}/read`);
  return response.data;
};
