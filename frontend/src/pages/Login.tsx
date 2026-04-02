import axios from 'axios';
import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../utils/api';
import { getAccessToken, getUserFromToken } from '../utils/auth';
import carousel1 from '../assets/images/carousel_login_1.jpeg';
import carousel2 from '../assets/images/carousel_login_2.jpeg';
import carousel3 from '../assets/images/carousel_login_3.jpeg';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorite } from '../context/useFavorite';
import ConflictDialog from '../components/common/ConflictDialog';
import { setLoginFlag } from '../utils/auth';

type LoginForm = {
  email: string;
  password: string;
};

const INITIAL_FORM: LoginForm = {
  email: '',
  password: '',
};

const Login = () => {
  const { t } = useTranslation();

  const getCarouselSlides = () => [
    {
      image: carousel1,
      title: t('auth.loginCarouselTitle1'),
      tagline: t('auth.loginCarouselTagline1'),
    },
    {
      image: carousel2,
      title: t('auth.loginCarouselTitle2'),
      tagline: t('auth.loginCarouselTagline2'),
    },
    {
      image: carousel3,
      title: t('auth.loginCarouselTitle3'),
      tagline: t('auth.loginCarouselTagline3'),
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const slides = useMemo(() => getCarouselSlides(), [t]);
  const { mergeGuestCart } = useCart();
  const { mergeGuestFavorites } = useFavorite();
  const location = useLocation();
  const navigate = useNavigate();
  const from =
    (location.state as { from?: string } | null)?.from || '/';
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      await axios.post(apiUrl('/auth/login'), {
        email: normalizedEmail,
        password: form.password,
      }, { withCredentials: true });

      // Set login flag (tokens are now in cookies, handled by backend)
      setLoginFlag();

      try {
        const savedCart = localStorage.getItem('pht_cart');
        const guestCart = savedCart ? JSON.parse(savedCart) : [];

        // Merge favorites silently
        await mergeGuestFavorites();

        if (guestCart.length > 0) {
          // Check DB cart to see if we need a conflict dialog
          const token = getAccessToken();
          const cartRes = await axios.get(apiUrl('/cart'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const dbCart = cartRes.data?.items || [];

          if (dbCart.length > 0) {
            // Both DB and local have items -> show dialog
            setShowConflictDialog(true);
            setLoading(false);
            return; // Pause login flow
          } else {
            // DB is empty, merge silently
            await mergeGuestCart();
          }
        }
      } catch (err) {
        console.error('Failed to merge guest data on login', err);
      }

      setSuccessMessage(t('auth.loginSuccessRedirecting'));
      // Redirect admin to admin page, others to intended page or home
      if (getUserFromToken()?.role === 'admin') {
        navigate('/admin/analytics', { replace: true });
      } else {
        navigate(from, { state: location.state });
      }
      setForm(INITIAL_FORM);

      // Redirect to dashboard or home after 1 second
      setTimeout(() => {
        console.log('Redirect to dashboard');
      }, 1000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.errors && Array.isArray(data.errors)) {
          // If backend returns validation errors array, join them or show first one
          const errorMessages = data.errors.map((e: { message: string }) => e.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data?.message ?? err.message ?? 'Unable to login');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to login');
      }
    } finally {
      if (!showConflictDialog) {
        setLoading(false);
      }
    }
  };

  const handleKeepPrevious = async () => {
    setShowConflictDialog(false);
    setLoading(true);
    try {
      await mergeGuestCart();
    } catch (e) {
      console.error(e);
    }
    setSuccessMessage('Login successful! Redirecting...');
    if (getUserFromToken()?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from, { state: location.state });
    }
    setLoading(false);
  };

  const handleStartFresh = async () => {
    setShowConflictDialog(false);
    setLoading(true);
    localStorage.removeItem('pht_cart');
    localStorage.removeItem('pht_guest_session_at');
    setSuccessMessage('Login successful! Redirecting...');
    if (getUserFromToken()?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from, { state: location.state });
      window.location.href = from === '/login' ? '/' : from;
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* LEFT SIDE - Carousel */}
      <div className="relative w-full lg:w-1/2 h:screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={getCarouselSlides()[currentSlide].image}
              alt="Fashion"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-8 left-8 right-8 z-10">
          <motion.h2
            key={`title-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-4xl text-white mb-2"
          >
            {getCarouselSlides()[currentSlide].title}
          </motion.h2>
          <motion.p
            key={`tag-${currentSlide}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/70 text-sm md:text-base"
          >
            {getCarouselSlides()[currentSlide].tagline}
          </motion.p>

          {/* Navigation dots */}
          <div className="flex gap-2 mt-4">
            {getCarouselSlides().map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Logo on carousel */}
        <div className="absolute top-6 left-8 z-10">
          <Link to="/" className="font-display text-2xl text-white tracking-wider">
            PHT<span className="text-primary">.</span>
          </Link>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white min-h-screen ">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-full"
        >

          <div className="w-full max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <img src="/src/assets/images/PHT-Fashion-Logo.png" alt="PHT" className="w-full h-full object-cover border-2 border-gray-300 rounded-full" />
              </div>
            </div>

            <a href="/" className="pt-4 text-black rounded-full inline-block text-center">
              <p className="font-bold">{t('common.home')}</p>
            </a>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('auth.welcomeBackTitle')}
              </h1>
              <p className="text-gray-500 text-sm">{t('auth.signInAccount')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  {t('auth.email')}*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.enterEmail')}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  {t('auth.password')}*
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('auth.rememberMe')}</span>
                </label>
                <a href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                  {t('auth.forgotPassword')}
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
              </button>

              {/* Error & Success Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">{t('auth.instantLogin')}</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{t('auth.google')}</span>
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{t('auth.facebook')}</span>
                </button>
              </div>
            </form>

            {/* Sign Up Link */}
            <p className="text-center mt-8 text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <a href="/signup" className="text-blue-600 font-medium hover:underline">
                {t('auth.register')}
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <ConflictDialog
        isOpen={showConflictDialog}
        onClose={() => setShowConflictDialog(false)}
        onKeep={handleKeepPrevious}
        onDiscard={handleStartFresh}
      />
    </div>
  );
};

export default Login;