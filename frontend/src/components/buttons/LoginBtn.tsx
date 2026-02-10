
import { Link } from 'react-router-dom';

//if md:hidden, hid the button and show the button in the hamburger menu

const LoginBtn = () => {
  return (
    <Link to="/login" className="bg-black text-white px-4 py-2 rounded-full inline-block text-center ">Login</Link>
  )
}

export default LoginBtn;