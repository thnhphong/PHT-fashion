import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { clearCart } = useCart();

    useEffect(() => {
        // Clear the cart when landing on the success page
        clearCart();
    }, [clearCart]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-sm text-center border border-gray-100">
                <div>
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Order Complete!
                    </h2>
                    <p className="mt-4 text-sm text-gray-500 max-w-sm mx-auto">
                        Thank you for your purchase. We've received your order and we are getting it ready to be shipped.
                    </p>
                    {orderId && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Order Reference</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">{orderId}</p>
                        </div>
                    )}
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/orders"
                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                    >
                        View My Orders
                    </Link>
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
