"""
Shared constants used across the application.
"""
from enum import Enum

class ExpenseCategory(str, Enum):
    """Expense and budget categories that match frontend definitions"""
    FOOD = "Food"
    TRANSPORTATION = "Transportation"
    RECREATION = "Recreation"
    HOUSING = "Housing"
    UTILITIES = "Utilities"
    PERSONAL_CARE = "Personal Care"
    SAVING = "Saving"
    DEBTS = "Debts"
    CLOTHING = "Clothing"
    PAYCHECK = "Paycheck"
    SETTLEMENT = "Settlement"

# List of all valid expense categories
EXPENSE_CATEGORIES = [
    ExpenseCategory.FOOD,
    ExpenseCategory.TRANSPORTATION,
    ExpenseCategory.RECREATION,
    ExpenseCategory.HOUSING,
    ExpenseCategory.UTILITIES,
    ExpenseCategory.PERSONAL_CARE,
    ExpenseCategory.SAVING,
    ExpenseCategory.DEBTS,
    ExpenseCategory.CLOTHING,
    ExpenseCategory.PAYCHECK,
    ExpenseCategory.SETTLEMENT,
]

# Category display information for frontend
CATEGORY_INFO = {
    ExpenseCategory.FOOD: {"icon": "🍽️", "color": "bg-orange-100 text-orange-800"},
    ExpenseCategory.TRANSPORTATION: {"icon": "🚗", "color": "bg-blue-100 text-blue-800"},
    ExpenseCategory.RECREATION: {"icon": "🎬", "color": "bg-purple-100 text-purple-800"},
    ExpenseCategory.HOUSING: {"icon": "🏠", "color": "bg-red-100 text-red-800"},
    ExpenseCategory.UTILITIES: {"icon": "⚡", "color": "bg-yellow-100 text-yellow-800"},
    ExpenseCategory.PERSONAL_CARE: {"icon": "🧴", "color": "bg-pink-100 text-pink-800"},
    ExpenseCategory.SAVING: {"icon": "💰", "color": "bg-emerald-100 text-emerald-800"},
    ExpenseCategory.DEBTS: {"icon": "💳", "color": "bg-red-100 text-red-800"},
    ExpenseCategory.CLOTHING: {"icon": "👕", "color": "bg-indigo-100 text-indigo-800"},
    ExpenseCategory.PAYCHECK: {"icon": "💵", "color": "bg-green-100 text-green-800"},
    ExpenseCategory.SETTLEMENT: {"icon": "💸", "color": "bg-blue-100 text-blue-800"},
}

