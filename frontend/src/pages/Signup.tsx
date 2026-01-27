import axios from 'axios';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';


const API_BASE_URL = 'http://localhost:5001';

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

const Signup = () => {
  const [form, setForm] = useState<SignUpForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // Updated to use /auth/register endpoint
        const response = await axios.post(`${API_BASE_URL}/api/users/register`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });

      setSuccessMessage(response.data.message || 'Account created successfully. You can now log in.');
      setForm(INITIAL_FORM);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.message ?? 'Unable to create account');
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
    <div className="auth-page">
      <h1>Sign Up</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </label>
        <label>
          Address
          <input name="address" value={form.address} onChange={handleChange} required />
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        {error && <p className="auth-error">{error}</p>}
        {successMessage && <p className="auth-success">{successMessage}</p>}
      </form>

      <p className="auth-link">
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default Signup;