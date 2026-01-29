import { Link } from 'react-router-dom';
import LoginBtn from '../buttons/LoginBtn';
import SignupBtn from '../buttons/SignupBtn';

const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex justify-between items-center">
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/categories">Categories</Link>
        <Link to="/admin/suppliers">Suppliers</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/coupons">Coupons</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/settings">Settings</Link>
        <Link to="/admin/logout">Logout</Link>
        <LoginBtn />
        <SignupBtn />
      </div>
    </div> 
  )
}
export default Navbar;