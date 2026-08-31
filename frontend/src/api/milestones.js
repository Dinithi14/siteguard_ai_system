import api from './client';

export const listProjectMilestones = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/milestones`);
  return response.data;
};

export const createMilestone = async (projectId, milestoneData) => {
  const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
  return response.data;
};

export const getMilestone = async (milestoneId) => {
  const response = await api.get(`/milestones/${milestoneId}`);
  return response.data;
};

export const updateMilestone = async (milestoneId, updateData) => {
  const response = await api.patch(`/milestones/${milestoneId}`, updateData);
  return response.data;
};

export const deleteMilestone = async (milestoneId) => {
  const response = await api.delete(`/milestones/${milestoneId}`);
  return response.data;
};
