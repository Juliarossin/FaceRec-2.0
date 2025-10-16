import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, provider, signInWithPopup } from "../../firebase";
import { motion } from "framer-motion";
import api, { apiBaseURL } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import Logo from "../../assets/Logo.png";
import {
  Eye,
  EyeOff,
  Brain,
  Shield,
  Zap,
  Network,
  Target,
  User,
  Lock,
  Mail,
  Chrome,
  Camera
} from "lucide-react";



export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const API_BASE = apiBaseURL;
  const { updateUser } = useUser();

  // Debug function para teste no console
  window.testLogin = async () => {
    console.log("🧪 Testando login com credenciais fixas");
    const testCredentials = {
      email: "teste@teste.com",
      password: "123456"
    };
    
    try {
      const res = await api.post("/login", testCredentials);
      console.log("🧪 Resultado do teste:", res.status, res.data);
      return { status: res.status, data: res.data };
    } catch (err) {
      if (err.response) {
        console.error("🧪 Erro no teste:", err.response.status, err.response.data);
        return { status: err.response.status, data: err.response.data };
      }
      console.error("🧪 Erro no teste:", err);
      return { error: err.message };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Usuário logado com Google:", result.user);

      const usuario = {
        email: result.user.email,
        full_name: result.user.displayName || "Usuário Google",
        profile_picture: result.user.photoURL || "",
        photoURL: result.user.photoURL || "",
        role: "professor",
        tipo: "professor"
      };

      localStorage.setItem("usuario", JSON.stringify(usuario));
      updateUser(usuario);
      navigate("/home");
    } catch (error) {
      console.error("Erro no login com Google:", error);
      alert("Falha no login com Google.");
    } finally {
      setLoading(false);
    }
  };

  // Credenciais de desenvolvimento/teste
  const credenciaisMock = {
    'admin@escola.com': { senha: '123456', role: 'admin', nome: 'Administrador Sistema' },
    'administrador@escola.com': { senha: '123456', role: 'admin', nome: 'Administrador FaceRec' },
    'professor@escola.com': { senha: '123456', role: 'professor', nome: 'Professor Silva' },
    'teste@teste.com': { senha: '123456', role: 'professor', nome: 'Usuário Teste' }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log("🔄 Iniciando login com:", { email: formData.email });
    
    try {
      // Verificar se é uma credencial de desenvolvimento
      const credencialMock = credenciaisMock[formData.email];
      
      if (credencialMock && formData.password === credencialMock.senha) {
        // Login mock para desenvolvimento
        console.log("🧪 Login mock detectado para:", formData.email);
        
        const usuario = {
          email: formData.email,
          full_name: credencialMock.nome,
          profile_picture: "",
          photoURL: "",
          role: credencialMock.role,
          tipo: credencialMock.role === 'admin' ? 'administrador' : 'professor'
        };

        console.log("🧪 Usuário criado para login mock:", usuario);
        console.log("🧪 Role:", credencialMock.role);
        console.log("🧪 Tipo:", credencialMock.role === 'admin' ? 'administrador' : 'professor');

        localStorage.setItem("token", `mock-token-${Date.now()}`);
        localStorage.setItem("usuario", JSON.stringify(usuario));
        updateUser(usuario);
        
        // Verificar se foi salvo corretamente
        const saved = localStorage.getItem("usuario");
        console.log("🧪 Usuário salvo no localStorage:", saved);
        console.log("🧪 Usuário parsed:", JSON.parse(saved));
        
        console.log("✅ Login mock bem-sucedido:", usuario);
        
        // Forçar recarregamento do contexto e navegação
        setTimeout(() => {
          // Recarregar a página para garantir que o contexto seja atualizado
          window.location.href = "/alunos";
        }, 200);
        return;
      }

      // Se não é credencial mock, tenta login real com backend
      console.log("🌐 Tentando login real com API:", API_BASE);
      
      const response = await api.post("/login", {
        email: formData.email,
        password: formData.password,
      });
      const data = response.data;
      console.log("📥 LOGIN RESPONSE:", response.status, data);

      if (!data?.token) throw new Error(data?.error || "Erro no login");

      const apiUser = data?.user;
      if (!apiUser?.id) {
        throw new Error("Resposta da API não retornou dados do usuário");
      }

      console.log("💾 Salvando token:", data.token);
      localStorage.setItem("token", data.token);

      const resolvedRole = apiUser.role === 'admin' ? 'admin' : 'professor';
      const usuario = {
        id: apiUser.id,
        email: apiUser.email || formData.email,
        full_name: apiUser.full_name || formData.email.split("@")[0],
        profile_picture: apiUser.profile_picture || "",
        photoURL: apiUser.photoURL || apiUser.profile_picture || "",
        role: resolvedRole,
        tipo: resolvedRole === 'admin' ? 'administrador' : 'professor',
        subject: apiUser.subject || "",
        school: apiUser.school || "",
        phone: apiUser.phone || "",
        cpf: apiUser.cpf || "",
        classes: Array.isArray(apiUser.classes) ? apiUser.classes : [],
      };

      console.log("👤 Salvando usuário:", usuario);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      updateUser(usuario);
      
      console.log("🎯 Redirecionando para /alunos");
      navigate("/alunos", { replace: true });
      
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Erro no login";
      console.error("❌ Login falhou:", message);
      alert(`Erro no login: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden login-background">
      
      {/* Overlay escuro para melhor legibilidade */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Efeitos de fundo Neural - bolinhas animadas */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 2,
              delay: i * 0.05,
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: Math.random() * 4
            }}
            className="absolute w-2 h-2 bg-gradient-to-r from-orange-200 to-orange-300 rounded-full" 
            style={{
              backgroundColor: 'rgba(228, 165, 118, 0.6)', 
              boxShadow: '0 0 8px rgba(228, 165, 118, 0.4)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Grid Neural Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(105, 142, 162, 0.4) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Container Principal Centralizado */}
      <div className="relative z-10 w-full max-w-md mx-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md backdrop-blur-sm rounded-3xl p-8 shadow-2xl" 
          style={{background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)'}}
        >
          {/* Cabeçalho */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 flex justify-center"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 p-3 shadow-2xl border-4 border-white/20">
                <img 
                  src={Logo} 
                  alt="FaceRec Logo" 
                  className="w-full h-full object-contain filter brightness-110"
                />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-2 tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              FaceRec Registry
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Please enter your details.
            </motion.p>
          </div>

          {/* Formulário */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleEmailLogin}
            className="space-y-6"
          >
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your e-mail"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/80 text-slate-800 font-medium"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="********"
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/80 text-slate-800 font-medium"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Opções do formulário */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-600 bg-white/15 border-orange-200/30 rounded focus:ring-orange-400 focus:ring-2"
                />
                <span className="ml-2 text-sm text-white font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-white hover:text-gray-200 transition-colors font-medium"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Forgot your password?
              </Link>
            </div>

            {/* Botão de Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 backdrop-blur-sm text-white rounded-lg font-bold hover:from-orange-700 hover:to-orange-600 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200/20 tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span style={{ fontFamily: "'Inter', sans-serif" }}>Processando...</span>
                </div>
              ) : (
                "Log in"
              )}
            </motion.button>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black/40 text-white font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>ou continue com</span>
              </div>
            </div>

            {/* Login com Google */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-6 border border-slate-300 bg-white/80 text-slate-700 rounded-xl font-bold hover:bg-white/90 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <Chrome className="w-5 h-5 text-blue-300" />
              <span>Google FaceRec Auth</span>
            </motion.button>
          </motion.form>

          {/* Link para Cadastro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-white font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              Don't have an account?{" "}
              <Link
                to="/cadastro"
                className="font-bold text-orange-300 hover:text-orange-200 underline transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Register here
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}