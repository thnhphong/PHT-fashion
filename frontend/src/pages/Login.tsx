import axios from 'axios';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

const API_BASE_URL = 'http://localhost:5001';

type LoginForm = {
  email: string;
  password: string;
};

const INITIAL_FORM: LoginForm = {
  email: '',
  password: '',
};

const Login = () => {
  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: form.email,
        password: form.password,
      });

      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setSuccessMessage('Login successful! Redirecting...');
      setForm(INITIAL_FORM);

      // Redirect to dashboard or home after 1 second
      setTimeout(() => {
        // You can use react-router-dom navigation here
        console.log('Redirect to dashboard');
      }, 1000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.message ?? 'Unable to login');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {error && <p className="auth-error">{error}</p>}
        {successMessage && <p className="auth-success">{successMessage}</p>}
      </form>

      <p className="auth-link">
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
};

export default Login;