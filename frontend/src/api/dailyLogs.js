import api from './client';

export const listProjectDailyLogs = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/daily-logs`);
  return response.data;
};

export const createDailyLog = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/daily-logs`, data);
  return response.data;
};

export const getDailyLog = async (logId) => {
  const response = await api.get(`/daily-logs/${logId}`);
  return response.data;
};

export const updateDailyLog = async (logId, data) => {
  const response = await api.patch(`/daily-logs/${logId}`, data);
  return response.data;
};

export const deleteDailyLog = async (logId) => {
  const response = await api.delete(`/daily-logs/${logId}`);
  return response.data;
};
