export function buildReceiptExtractionPrompt(emailText: string) {
  return `You are a receipt extraction engine. Extract information from the email below.

Rules:
1. Return ONLY valid compact JSON. No markdown, no explanations.
2. If a field cannot be determined, use null.
3. If no return deadline is stated and purchase_date is known, calculate return_deadline as purchase_date + 30 days.
4. Currency defaults to "USD" if not specified.
5. Item name should be concise, maximum 10 words.
6. Store name should be the merchant or brand name only.
7. Purchase and deadline dates must use YYYY-MM-DD.
8. Confidence must be a number from 0.0 to 1.0.
9. If the email is only shipping, marketing, refund confirmation, or not an order receipt, use confidence below 0.7.

Fields:
- store_name: string or null
- item_name: string or null
- price: number or null
- currency: string
- purchase_date: string or null
- return_deadline: string or null
- warranty_deadline: string or null
- confidence: number

Email text:
"""
${emailText.slice(0, 24000)}
"""

Output format:
{"store_name":"...","item_name":"...","price":99.99,"currency":"USD","purchase_date":"2026-05-01","return_deadline":"2026-05-31","warranty_deadline":null,"confidence":0.92}`;
}
