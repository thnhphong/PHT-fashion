import { Link } from 'react-router-dom';
import LoginBtn from '../buttons/LoginBtn';
import SignupBtn from '../buttons/SignupBtn';

const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex justify-between items-center">
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        
        <LoginBtn />
        <SignupBtn />
      </div>
    </div> 
  )
}
export default Navbar;