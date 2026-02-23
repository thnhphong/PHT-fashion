import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, Menu, X, Heart, User } from "lucide-react";
import { Button } from "../ui/button";
import LoginBtn from "../buttons/LoginBtn";
import SignupBtn from "../buttons/SignupBtn";
import SearchInput from "../common/SearchInput";
import { isAuthenticated, logOut } from "../../utils/auth";
import { LogOut } from "../buttons/LogOut";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useFavorite } from "../../context/useFavorite";


//put login and signup buttons in the hamburger menu
const navLinks = [
  { name: "All Products", href: "/products" },
  { name: "New In", href: "#new" },
  { name: "Best Sellers", href: "#trending" },
  { name: "Sale", href: "#sale" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const { favorites } = useFavorite();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed px-4 top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "bg-background/95 backdrop-blur-lg py-3 shadow-lg"
        : "bg-transparent py-5"
        }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl md:text-3xl tracking-wider text-foreground">
            PHT<span className="text-primary">.</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:underline underline-offset-4 underline-orange-500 text-sm font-medium text-muted-foreground hover:text-orange-500 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative">

            <SearchInput />

          </div>

          <Button variant="ghost" size="icon" className="hidden md:flex">
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex relative"
            onClick={() => navigate('/favorite')}
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                {favorites.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
              {getTotalItems()}
            </span>
          </Button>
          {/* if user is authenticated, show the logout button, else show the login and signup button if not authenticated */}
          {isAuthenticated() ? <LogOut handleLogout={logOut} /> : <LoginBtn />}
          {!isAuthenticated() ? <SignupBtn /> : null}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-lg border-t border-border"
          >
            <div className="container-custom py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              {/* Search Form */}
              <SearchInput />

              <div className="flex justify-center gap-4 pt-4 border-t border-border items-center">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/favorite');
                  }}
                >
                  <Heart className="h-5 w-5" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                      {favorites.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
