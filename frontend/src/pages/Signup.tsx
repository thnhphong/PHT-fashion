import axios from 'axios';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import PHTLogo from '../assets/images/PHT-Fashion-Logo.png';
import { apiUrl } from '../utils/api';
import { motion } from 'framer-motion';
import {Link} from 'react-router-dom';
import image from '../assets/images/img_signup.png';
import { Truck, Sparkles, Gift, Award } from 'lucide-react';

type SignUpForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

const INITIAL_FORM: SignUpForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
};

const benefits = [
  { icon: Truck, title: "Free Shipping on First Order", desc: "No minimum spend required" },
  { icon: Sparkles, title: "Early Access to New Drops", desc: "Be first to shop new collections" },
  { icon: Gift, title: "Birthday Surprises", desc: "Special gifts on your special day" },
  { icon: Award, title: "Style Rewards Program", desc: "Earn points on every purchase" },
];

const Signup = () => {
  const [form, setForm] = useState<SignUpForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!agreeToTerms) {
      setError('Please agree to the Terms, Privacy Policy and Fees');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(apiUrl('/users/register'), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });

      setSuccessMessage(response.data.message || 'Account created successfully. You can now log in.');
      setForm(INITIAL_FORM);
      setAgreeToTerms(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.errors && Array.isArray(data.errors)) {
           // If backend returns validation errors array, join them or show first one
           const errorMessages = data.errors.map((e: { message: string }) => e.message).join(', ');
           setError(errorMessages);
        } else {
           setError(data?.message ?? err.message ?? 'Unable to create account');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" w-full flex">
      {/* Left Side - Sign Up Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white">
        <motion.div
      initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-full"
      >
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex justify-between">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <img src={PHTLogo} alt="PHT" className="w-full h-full object-cover border-2 border-gray-300 rounded-full" />
            </div>
            <span className="text-xl font-bold text-gray-800">PHT</span>
          </div>

           <a href="/" className="pt-4 text-black rounded-full inline-block text-center">
           <p className="font-bold">Home</p>
           </a>
          </div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-gray-500 text-sm">Let's get started with your 30 days free trial</p>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Login with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* flex group of name and phone */}
            {/* Name Input */}
            <div className="flex w-full justify-between gap-2">
              <div className="w-1/2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
              {/* Phone Input */}
              <div className="w-1/2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                  Phone<span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
            </div>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
            {/* Address Input */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                Address<span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your address"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 focus:border-transparent outline-none transition-all text-sm pr-12"
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

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-black-600 border-gray-300 rounded focus:ring-black-500"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-gray-600 text-left">
                I agree to all{' '}
                <a href="/terms" className="text-gray-900 hover:underline">Term</a>,{' '}
                <a href="/privacy" className="text-gray-900 hover:underline">Privacy Policy</a> and{' '}
                <a href="/fees" className="text-gray-900 hover:underline">Fees</a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreeToTerms}
              className="w-full py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creating account…' : 'Sign Up'}
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
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-gray-900 font-medium hover:underline">
              Log in
            </a>
          </p>
        </div>
        </motion.div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src={image} alt="PHT Fashion" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-center px-12">
          <h2 className="font-display text-4xl text-white mb-8">Why Join PHT?</h2>
          <div className="space-y-6">
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: benefits.indexOf(b) * 0.15 }}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-orange-500/50 backdrop-blur-lg flex items-center justify-center shrink-0">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{b.title}</h3>
                  <p className="text-white/60 text-xs">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        </div>
    </div>
  );
};

export default Signup;