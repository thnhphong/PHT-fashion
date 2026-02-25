export class CurrencyConverter {
    // Assuming a static exchange rate for demonstration.
    // In a real application, you might fetch this dynamically from an API.
    private static readonly VND_TO_USD_RATE = 25000;

    /**
     * Converts VND amount to USD string formatted to 2 decimal places.
     * PayPal requires the amount format to be string like "10.00"
     * @param vndAmount Amount in Vietnamese Dong
     * @returns String representation of USD amount
     */
    public static vndToUsd(vndAmount: number): string {
        const usdAmount = vndAmount / this.VND_TO_USD_RATE;
        return usdAmount.toFixed(2);
    }
}
