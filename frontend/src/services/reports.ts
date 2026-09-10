import api from "./api";

const cleanFilename = (filename: string, ext: string) => {
  let base = filename;
  for (const e of [".json", ".txt", ".pdf", ".html"]) {
    if (base.toLowerCase().endsWith(e)) {
      base = base.substring(0, base.length - e.length);
      break;
    }
  }
  return `${base}.${ext}`;
};

export const downloadJsonReport = async (filename: string) => {
  try {
    const targetName = cleanFilename(filename, "json");
    const response = await api.get(`/api/v1/reports/json/${targetName}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("JSON Report Download Failed", error);
    throw error;
  }
};

export const downloadTextReport = async (filename: string) => {
  try {
    const targetName = cleanFilename(filename, "txt");
    const response = await api.get(`/api/v1/reports/text/${targetName}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Text Report Download Failed", error);
    throw error;
  }
};

export const downloadPdfReport = async (filename: string) => {
  try {
    const targetName = cleanFilename(filename, "pdf");
    const response = await api.get(`/api/v1/reports/pdf/${targetName}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF Report Download Failed", error);
    throw error;
  }
};