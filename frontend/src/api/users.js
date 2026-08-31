import api from './client';

export const createUser = async (data) => {
  const response = await api.post('/users/', data);
  return response.data;
};

export const listUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId, data) => {
  const response = await api.patch(`/users/${userId}`, data);
  return response.data;
};

export const adminUpdateUser = async (userId, data) => {
  const response = await api.patch(`/users/${userId}/admin`, data);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};
