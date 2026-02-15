// components/AuthModal.jsx
import React, { useState } from "react";
import DarkVeil from "./backgrounds/DarkVeil"; // Ensure the path matches your file structure

const AuthModal = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          onLogin(data.data.user, data.data.token);
        } else {
          setIsLogin(true);
          setFormData({ name: "", email: formData.email, password: "" });
          setError("Account created successfully! Please login.");
        }
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: "", email: "", password: "" });
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Shader Layer */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={10}
          speed={0.3}
          noiseIntensity={0.02}
          scanlineIntensity={0.15}
          scanlineFrequency={2.0}
          warpAmount={0.1}
        />
      </div>

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md transition-all duration-500">
        {/* Decorative Outer Glow (matches the shader energy) */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl rounded-3xl" />

        <div className="relative bg-[#0a0a0a]/70 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Subtle Top Light Highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header */}
          <div className="p-8 pb-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold tracking-tighter text-white">
                Document
                <span className="bg-gradient-to-br from-cyan-300 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {" "}
                  AI
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-3 font-medium">
                {isLogin
                  ? "Secure access to your intelligence hub"
                  : "Join the future of document processing"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm border transition-all animate-in fade-in zoom-in duration-300 ${
                  error.includes("successful")
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${error.includes("successful") ? "bg-green-400" : "bg-red-400"}`}
                  />
                  {error}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="group">
                  <label className="block text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] mb-2 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:bg-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-300"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="group">
                <label className="block text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:bg-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-300"
                  placeholder="email@example.com"
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] mb-2 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:bg-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden group py-4 px-4 mt-4 bg-white text-black font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
              >
                {/* Button Hover Shine Effect */}
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-black/5" />
                </div>

                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      Initializing...
                    </>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 mt-4 border-t border-white/5 bg-white/[0.02] text-center">
            <p className="text-gray-500 text-sm font-medium">
              {isLogin ? "New to the platform?" : "Joined us before?"}{" "}
              <button
                onClick={toggleMode}
                disabled={loading}
                className="text-white hover:text-cyan-400 font-bold transition-colors ml-1 underline-offset-4 hover:underline"
              >
                {isLogin ? "Sign Up Free" : "Sign In Now"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
