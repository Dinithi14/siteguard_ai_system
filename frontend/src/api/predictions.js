import api from './client';

export const runPrediction = async (projectId, predictionInput) => {
  const response = await api.post(`/projects/${projectId}/predictions`, predictionInput);
  return response.data;
};

export const listProjectPredictions = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/predictions`);
  return response.data;
};

export const getPredictionById = async (predictionId) => {
  const response = await api.get(`/predictions/${predictionId}`);
  return response.data;
};
