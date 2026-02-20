// hooks/useQueryDocument.js
import { useState, useEffect } from "react";

const useQueryDocument = () => {
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState(null);

  // Now stores the actual model identifier e.g. "gemini-2.0-flash" or "llama3:latest"
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Fetch both cloud and local models on mount
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    setModelsLoading(true);
    try {
      // Fetch local Ollama models
      const localRes = await fetch(
        "http://localhost:5000/api/models/installed",
      );
      const localData = await localRes.json();
      const localModels = (localData.models || []).map((m) => ({
        id: m.name, // e.g. "llama3:latest"
        label: m.name,
        type: "local",
      }));

      // Cloud models are static — add yours here
      const cloudModels = [
        {
          id: "gemini-3-flash-preview",
          label: "Gemini 3.0 Flash",
          type: "cloud",
        },
        // add more cloud models here as needed
      ];

      const all = [...cloudModels, ...localModels];
      setAvailableModels(all);

      // Set default: first cloud model, fallback to first available
      if (!selectedModel) {
        const defaultModel = all.find((m) => m.type === "cloud") || all[0];
        if (defaultModel) setSelectedModel(defaultModel.id);
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
    } finally {
      setModelsLoading(false);
    }
  };

  const sendQuery = async (
    queryText,
    documentIds = [],
    useAI = true,
    conversationId = null,
  ) => {
    setQuerying(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");

      // Derive provider type from selected model
      const modelInfo = availableModels.find((m) => m.id === selectedModel);
      const provider = modelInfo?.type || "cloud";

      const response = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryText,
          documentIds,
          useAI,
          conversationId,
          provider,
          model: selectedModel, // send actual model ID to backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Query failed");
      }

      return await response.json();
    } catch (err) {
      console.error("Query error:", err);
      setError(err.message);
      throw err;
    } finally {
      setQuerying(false);
    }
  };

  return {
    sendQuery,
    querying,
    error,
    setError,
    selectedModel,
    setSelectedModel,
    availableModels,
    modelsLoading,
    refreshModels: fetchAvailableModels,
  };
};

export default useQueryDocument;
