import PHTLogo from '../logo/PHTLogo';
import LoginBtn from '../buttons/LoginBtn';
import SignupBtn from '../buttons/SignupBtn';
import MenuDropdown from './MenuDropdown';
import { Link } from 'react-router-dom';
const Navbar = () => {

  return (
    
  //   <div className="flex justify-between items-center p-4">
  //     <div className="flex justify-between items-center">
  //       <Link to="/">Home</Link>
  //       <Link to="/products">Products</Link>
  //       <Link to="/admin">Admin</Link>
  //       <Link to="/admin/products">Products</Link>
  //       <Link to="/admin/categories">Categories</Link>
  //       <Link to="/admin/suppliers">Suppliers</Link>
  //       <Link to="/admin/orders">Orders</Link>
  //       <Link to="/admin/coupons">Coupons</Link>
  //       <Link to="/admin/users">Users</Link>
  //       <Link to="/admin/settings">Settings</Link>
  //       <Link to="/admin/logout">Logout</Link>
  //       <LoginBtn />
  //       <SignupBtn />
  //     </div>
  //   </div> 
  //make navbar (logo, dropdown(loading category), about, contact, search bar, login, signup btn)
<div className="bg-white text-black p-4">
  <div className="flex justify-between items-center">
    <PHTLogo />
    <div className="flex gap-6 items-center">
      <MenuDropdown />
    <Link to="/about" className="text-black px-4 py-2 rounded-full inline-block text-center">About</Link>
    <Link to="/contact" className="text-black px-4 py-2 rounded-full inline-block text-center">Contact</Link>
    </div>
    <form  className="relative hidden md:block w-64">
              <input
                placeholder="Search..."
                className="w-full px-4 py-2 pr-10 text-sm bg-white border border-rose-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                type="text"
                
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-rose-400 hover:text-rose-600 cursor-pointer"
              >
                <i className="ri-search-line text-sm"></i>
              </button>
            </form>
   <div className="flex gap-2">
     <LoginBtn />
    <SignupBtn /> 
   </div>
  </div>
</div>    
  )
}
export default Navbar;