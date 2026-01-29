
import { Link } from 'react-router-dom';

const LoginBtn = () => {
  return (
    <Link to="/login" className="bg-black text-white px-4 py-2 rounded-full inline-block text-center">Login</Link>
  )
}

export default LoginBtn;