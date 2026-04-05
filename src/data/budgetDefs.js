export const budgetDefs = {
  needs: [
    { id: "rent", label: "Rent (Virtual)", mode: "fixed", value: 193.75, note: "Fortnightly rent ÷ 4 ÷ number of people ÷ 2 weeks", account: "Bills" },
    { id: "electricity", label: "Electricity (Virtual)", mode: "pctOfCategory", value: 0.04, note: "Average payment ÷ 4 ÷ 4", account: "Bills" },
    { id: "internet", label: "Internet", mode: "fixed", value: 5.625, note: "Payment ÷ 4 ÷ 4", account: "Bills" },
    { id: "phone", label: "Phone", mode: "fixed", value: 12.5, note: "About $50/month", account: "Bills" },
    { id: "groceries", label: "Groceries / Food", mode: "fixed", value: 120, note: "About $120/week", account: "Float" },
    { id: "fuel", label: "Transport – Fuel", mode: "pctOfCategory", value: 0.22, note: "Percentage of needs budget", account: "Float" },
    { id: "rego", label: "Transport – Rego", mode: "fixed", value: 15, note: "About $820/yr ÷ 52 weeks", account: "Bills" },
    { id: "gym", label: "Gym / Health", mode: "fixed", value: 18.53, note: "$18.53/week", account: "Subscriptions" },
  ],
  wants: [
    { id: "eating_out", label: "Eating Out / Takeaway", mode: "pctOfCategory", value: 0.3, note: "About 30%", account: "Float" },
    { id: "entertainment", label: "Entertainment", mode: "pctOfCategory", value: 0.1, note: "Movies, events, etc", account: "Float" },
    { id: "hobbies", label: "Hobbies", mode: "pctOfCategory", value: 0.1, note: "D&D, 3D printing, online purchases", account: "Float" },
    { id: "subscriptions", label: "Subscriptions", mode: "fixed", value: 24.36, note: "D&D Beyond, Owlbear, Dropout", account: "Subscriptions" },
    { id: "clothing", label: "Clothing / Shopping", mode: "pctOfCategory", value: 0.2, note: "About a shirt a week", account: "Float" },
    { id: "personal_care", label: "Personal Care / Beauty", mode: "fixed", value: 10, note: "Haircut, toiletries, etc", account: "Float" },
  ],
  savings: [
    { id: "emergency", label: "Emergency Fund", mode: "pctOfCategory", value: 0.2, note: "Until 3 months expenses saved", account: "Emergency Fund" },
    { id: "investments", label: "Investments / Shares", mode: "pctOfCategory", value: 0.35, note: "Main wealth builder", account: "Investments" },
    { id: "medical", label: "Medical", mode: "pctOfCategory", value: 0.3, note: "Money aside for medical bills", account: "Medical" },
    { id: "short_term", label: "Savings", mode: "pctOfCategory", value: 0.15, note: "Holiday or item", account: "Savings" },
  ],
};
