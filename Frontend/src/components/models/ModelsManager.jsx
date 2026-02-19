// components/ModelsManager.jsx
import React, { useState, useEffect } from "react";

const ModelsManager = ({ isMobile }) => {
  const [installedModels, setInstalledModels] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("installed"); // "installed" | "explore"
  const [deletingModel, setDeletingModel] = useState(null);
  const [pullingModel, setPullingModel] = useState(null);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // model name to confirm delete
  const [pullProgress, setPullProgress] = useState({});

  useEffect(() => {
    fetchInstalledModels();
  }, []);

  const fetchInstalledModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/models/installed");
      const data = await res.json();
      setInstalledModels(data.models || []);
    } catch (err) {
      setError("Failed to fetch installed models.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/models/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      setSearchResults(data.models || []);
    } catch (err) {
      setError("Search failed.");
      console.log(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDelete = async (modelName) => {
    setDeletingModel(modelName);
    setDeleteConfirm(null);
    try {
      await fetch(`/api/models/${encodeURIComponent(modelName)}`, {
        method: "DELETE",
      });
      setInstalledModels((prev) => prev.filter((m) => m.name !== modelName));
    } catch (err) {
      setError("Failed to delete model.");
    } finally {
      setDeletingModel(null);
    }
  };

  const handlePull = (modelName) => {
    // Initialize progress state for this model
    setPullProgress((prev) => ({
      ...prev,
      [modelName]: {
        percent: 0,
        status: "Connecting...",
        speed: null,
        eta: null,
        done: false,
        error: null,
      },
    }));

    const evtSource = new EventSource(
      `http://localhost:5000/api/models/pull/${encodeURIComponent(modelName)}/stream`,
    );

    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "start") {
        setPullProgress((prev) => ({
          ...prev,
          [modelName]: { ...prev[modelName], status: "Starting..." },
        }));
      }

      if (data.type === "progress") {
        setPullProgress((prev) => ({
          ...prev,
          [modelName]: {
            ...prev[modelName],
            percent: data.percent ?? prev[modelName].percent,
            status: data.status,
            speed: data.speed ?? prev[modelName].speed,
            eta: data.eta ?? prev[modelName].eta,
            downloaded: data.downloaded ?? prev[modelName].downloaded,
            total: data.total ?? prev[modelName].total,
          },
        }));
      }

      if (data.type === "done") {
        setPullProgress((prev) => ({
          ...prev,
          [modelName]: {
            ...prev[modelName],
            percent: 100,
            status: "Complete",
            done: true,
          },
        }));
        evtSource.close();
        // Refresh installed list after short delay so user sees "Complete" briefly
        setTimeout(() => {
          fetchInstalledModels();
          setPullProgress((prev) => {
            const next = { ...prev };
            delete next[modelName];
            return next;
          });
        }, 2000);
      }

      if (data.type === "error") {
        setPullProgress((prev) => ({
          ...prev,
          [modelName]: {
            ...prev[modelName],
            status: "Failed",
            error: data.message,
          },
        }));
        evtSource.close();
      }
    };

    evtSource.onerror = () => {
      setPullProgress((prev) => ({
        ...prev,
        [modelName]: {
          ...prev[modelName],
          status: "Connection lost",
          error: "SSE connection failed",
        },
      }));
      evtSource.close();
    };
  };

  const isInstalled = (modelName) =>
    installedModels.some((m) => m.name === modelName);
  // console.log({ installedModels });

  const formatSize = (sizeBytes) => {
    if (!sizeBytes) return "Unknown size";
    const gb = sizeBytes / 1e9;
    return gb >= 1
      ? `${gb.toFixed(1)} GB`
      : `${(sizeBytes / 1e6).toFixed(0)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      {/* Header — mirrors MainContent's welcome header style */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-white/5">
        <div
          className={`w-full mx-auto ${
            isMobile
              ? "max-w-sm"
              : "max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
          }`}
        >
          <h1
            className={`font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent ${
              isMobile
                ? "text-3xl sm:text-4xl mb-1"
                : "text-4xl sm:text-5xl mb-2"
            }`}
          >
            Model
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
              Manager
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            View, search, and manage your local Ollama models
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-5">
        <div
          className={`w-full mx-auto ${
            isMobile
              ? "max-w-sm"
              : "max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
          }`}
        >
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("installed")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "installed"
                  ? "bg-cyan-500/20 text-cyan-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Installed
              {installedModels.length > 0 && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === "installed"
                      ? "bg-cyan-500/30 text-cyan-300"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {installedModels.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "explore"
                  ? "bg-cyan-500/20 text-cyan-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`w-full mx-auto ${
              isMobile
                ? "max-w-sm"
                : "max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
            }`}
          >
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 ml-3 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
        <div
          className={`w-full mx-auto pb-8 ${
            isMobile
              ? "max-w-sm"
              : "max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
          }`}
        >
          {/* ── INSTALLED TAB ── */}
          {activeTab === "installed" && (
            <div>
              {/* Refresh button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={fetchInstalledModels}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                  <svg
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              {loading ? (
                <InstalledSkeleton />
              ) : installedModels.length === 0 ? (
                <EmptyState
                  icon={
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  }
                  title="No models installed"
                  subtitle='Switch to "Explore" to download your first model'
                />
              ) : (
                <div className="space-y-3">
                  {installedModels.map((model) => (
                    <div
                      key={model.name}
                      className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Model info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white truncate">
                              {model.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                              Local
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>{formatSize(model.size)}</span>
                            {model.modified_at && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-700 flex-shrink-0" />
                                <span>
                                  Modified {formatDate(model.modified_at)}
                                </span>
                              </>
                            )}
                            {model.details?.parameter_size && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-700 flex-shrink-0" />
                                <span>{model.details.parameter_size}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        {deleteConfirm === model.name ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(model.name)}
                              disabled={deletingModel === model.name}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {deletingModel === model.name
                                ? "Deleting…"
                                : "Confirm"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(model.name)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title="Delete model"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EXPLORE TAB ── */}
          {activeTab === "explore" && (
            <div>
              {/* Search bar */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search Ollama models (e.g. llama3, mistral…)"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-5 py-3 rounded-xl text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {searchLoading ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {/* Results */}
              {searchResults.length === 0 && !searchLoading && (
                <EmptyState
                  icon={
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                  title="Search for models"
                  subtitle="Enter a model name above to find available Ollama models"
                />
              )}

              {searchLoading && <ExploreSkeleton />}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((model) => {
                    const installed = isInstalled(model.name);
                    const pulling = pullingModel === model.name;
                    return (
                      <div
                        key={model.name}
                        className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white">
                                {model.name}
                              </span>
                              {installed && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                                  Installed
                                </span>
                              )}
                            </div>
                            {model.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {model.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                              {model.size && <span>{model.size}</span>}
                              {model.pulls && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                                  <span>
                                    {model.pulls.toLocaleString()} pulls
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Download button */}
                          {/* Inside your searchResults.map() — replace the button block */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-1 min-w-[110px]">
                            {installed && !pullProgress[model.name] ? (
                              // Already installed, no active pull
                              <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-gray-500">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Installed
                              </span>
                            ) : pullProgress[model.name] ? (
                              // Actively pulling — show progress
                              <PullProgressWidget
                                progress={pullProgress[model.name]}
                              />
                            ) : (
                              // Not installed, not pulling
                              <button
                                onClick={() => handlePull(model.name)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all duration-200"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton loaders ── */
const InstalledSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 animate-pulse"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-40" />
            <div className="h-3 bg-white/5 rounded w-56" />
          </div>
          <div className="h-8 w-8 bg-white/5 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const ExploreSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 animate-pulse"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-3 bg-white/5 rounded w-64" />
            <div className="h-3 bg-white/5 rounded w-24" />
          </div>
          <div className="h-8 w-24 bg-white/5 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Empty state ── */
const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="text-gray-700 mb-4">{icon}</div>
    <p className="text-gray-300 font-medium mb-1">{title}</p>
    <p className="text-gray-600 text-sm max-w-xs">{subtitle}</p>
  </div>
);

const PullProgressWidget = ({ progress }) => {
  const { percent, status, speed, eta, done, error } = progress;
  const isError = !!error;

  return (
    <div className="w-full min-w-[160px] space-y-1.5">
      {/* Status row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs truncate ${
            isError ? "text-red-400" : done ? "text-green-400" : "text-cyan-400"
          }`}
        >
          {isError ? error : status}
        </span>
        {percent !== null && !isError && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {percent}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {percent !== null && !isError && (
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              done ? "bg-green-400" : "bg-cyan-400"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Speed + ETA row */}
      {(speed || eta) && !done && !isError && (
        <div className="flex items-center gap-2 text-[11px] text-gray-600">
          {speed && <span>{speed}</span>}
          {eta && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>{eta} remaining</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
// ```

// ---

// ## What it looks like end to end
// ```
// User clicks Download
//       │
//       ▼
// Frontend opens EventSource → GET /api/models/pull/llama3/stream
//       │
//       ▼
// Backend spawns `ollama pull llama3`
//       │  stdout/stderr lines stream in
//       ▼
// parseOllamaProgressLine() converts each line to structured JSON
//       │
//       ▼
// SSE events fire: start → progress (many) → done
//       │
//       ▼
// Frontend updates pullProgress[modelName] on each event
//       │
//       ▼
// PullProgressWidget re-renders: progress bar fills, speed + ETA update live
//       │
//       ▼
// "done" event → bar turns green → 2s delay → installed list refreshes

export default ModelsManager;
