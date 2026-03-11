/**
 * PendingPaymentBanner.tsx
 *
 * Shopee-style "Awaiting Payment" banner. Shows a fixed bottom-right card for
 * every active pending payment the user has, with:
 *   - Absolute deadline: "Please pay before 15:33 06-03-2026"
 *   - Live countdown showing time remaining
 *   - "Continue Payment" button that calls the resume endpoint
 *
 * Usage — drop into any page (checkout, orders, dashboard):
 *   import PendingPaymentBanner from '@/components/PendingPaymentBanner';
 *   <PendingPaymentBanner />
 */

import { useEffect, useState, useCallback } from 'react';
import { apiUrl } from '../utils/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PendingItem {
  productName: string;
  quantity: number;
  unit_price: number;
  productSize?: string;
}

interface PendingPayment {
  _id: string;
  draftId: string;
  paymentMethod: 'paypal' | 'vnpay';
  totalAmount: number;
  status: 'awaiting_payment' | 'expired';
  expiresAt: string;
  items: PendingItem[];
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

/** Absolute deadline string matching the Shopee format: "15:33 06-03-2026" */
const formatDeadline = (expiresAt: string): string => {
  const d = new Date(expiresAt);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}-${mo}-${yyyy}`;
};

/** Relative countdown — shows hours for long windows, minutes+seconds for short ones */
const getTimeLeft = (expiresAt: string): string => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  }
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${totalMinutes}m ${seconds}s`;
};

const PAYMENT_LABELS: Record<string, string> = {
  paypal: 'PayPal',
  vnpay: 'VNPay (NAPAS)',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PendingPaymentBanner() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  const fetchPending = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken'); // adjust to your auth store
      const res = await fetch(apiUrl('/payments/pending'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: PendingPayment[] = await res.json();
      setPendingPayments(data.filter((p) => p.status === 'awaiting_payment'));
    } catch (err) {
      console.error('Failed to fetch pending payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Tick countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(() => {
        const updated: Record<string, string> = {};
        for (const p of pendingPayments) {
          updated[p._id] = getTimeLeft(p.expiresAt);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingPayments]);

  const handleResume = async (payment: PendingPayment) => {
    setResuming(payment._id);
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint =
        payment.paymentMethod === 'paypal'
          ? apiUrl(`/payments/paypal/resume/${payment.draftId}`)
          : apiUrl(`/payments/vnpay/resume/${payment.draftId}`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 410) {
        setPendingPayments((prev) => prev.filter((p) => p._id !== payment._id));
        alert('Your payment session has expired. Please start a new checkout.');
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Failed to resume payment');
        return;
      }

      const data = await res.json();
      if (payment.paymentMethod === 'paypal' && data.approval_url) {
        window.location.href = data.approval_url;
      } else if (payment.paymentMethod === 'vnpay' && data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (err) {
      console.error('Resume payment error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setResuming(null);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const visible = pendingPayments.filter((p) => !dismissed.has(p._id));

  if (loading || visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {visible.map((payment) => {
        const tl = timeLeft[payment._id] ?? getTimeLeft(payment.expiresAt);
        const isExpired = tl === 'Expired';

        return (
          <div
            key={payment._id}
            className="bg-white border border-orange-200 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-orange-500 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">Chờ thanh toán</span>
                <span className="bg-white text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">
                  {PAYMENT_LABELS[payment.paymentMethod]}
                </span>
              </div>
              <button
                onClick={() => handleDismiss(payment._id)}
                className="text-white hover:text-orange-100 text-lg leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              {/* Items preview */}
              <div className="mb-2">
                {payment.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700 truncate">
                    {item.productName}
                    {item.productSize && (
                      <span className="text-gray-400 ml-1">({item.productSize})</span>
                    )}{' '}
                    × {item.quantity}
                  </div>
                ))}
                {payment.items.length > 2 && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    +{payment.items.length - 2} sản phẩm khác
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Tổng tiền:</span>
                <span className="text-orange-500 font-bold text-base">
                  {formatVND(payment.totalAmount)}
                </span>
              </div>

              {/* Deadline block — matches Shopee's exact phrasing */}
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-3">
                {isExpired ? (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠ Phiên thanh toán đã hết hạn
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Vui lòng thanh toán trước{' '}
                      <span className="font-semibold text-orange-600">
                        {formatDeadline(payment.expiresAt)}
                      </span>{' '}
                      để tránh hệ thống tự động hủy đơn hàng này.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Còn lại:{' '}
                      <span className="font-medium text-orange-500">{tl}</span>
                    </p>
                  </>
                )}
              </div>

              {/* Action */}
              {isExpired ? (
                <p className="text-xs text-gray-400 text-center py-1">
                  Vui lòng đặt hàng lại
                </p>
              ) : (
                <button
                  onClick={() => handleResume(payment)}
                  disabled={resuming === payment._id}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  {resuming === payment._id ? 'Đang chuyển hướng…' : 'Thanh Toán Ngay'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}