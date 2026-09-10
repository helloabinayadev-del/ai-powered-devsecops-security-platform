import api from "./api";

export const getHistory = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await api.get("/api/v1/history/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.history;

  } catch (error) {
    console.error("History Fetch Failed:", error);
    return [];
  }
};