
import { useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  X,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  PiggyBank,
  LayoutDashboard,
  ReceiptText,
  Target,
} from "lucide-react";

import "./App.css";
import FinanceChart, {
  type Transaction,
} from "./components/FinanceChart";
import SavingsGoals from "./components/SavingsGoals";

const API = "/api/transactions";
const BUDGET_API = "/api/budgets";

type BudgetSummary = {
  hasBudget: boolean;
  budgetMonth: string;
  limitAmount: number | null;
  actualExpense: number;
  remainingAmount: number | null;
  usagePercentage: number | null;
};

// Lấy ngày hiện tại theo giờ máy tính, định dạng yyyy-MM-dd
function getLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonth(): string {
  return getLocalDate().slice(0, 7);
}

// Chuyển yyyy-MM-dd thành dd/MM/yyyy
function formatDateVN(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

// Kiểm tra dd/MM/yyyy và chuyển thành yyyy-MM-dd
function parseDateVN(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const parsedDate = new Date(
    yearNumber,
    monthNumber - 1,
    dayNumber
  );

  if (
    parsedDate.getFullYear() !== yearNumber ||
    parsedDate.getMonth() !== monthNumber - 1 ||
    parsedDate.getDate() !== dayNumber
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function money(value: number): string {
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatMonth(month: string): string {
  if (month === "all") {
    return "Tất cả giao dịch";
  }

  const [year, monthNumber] = month.split("-");
  return `Tháng ${Number(monthNumber)}/${year}`;
}

async function getApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.message === "string") {
      return data.message;
    }

    if (typeof data.title === "string") {
      return data.title;
    }

    if (data.errors && typeof data.errors === "object") {
      const messages = Object.values(data.errors)
        .flat()
        .filter(
          (value): value is string => typeof value === "string"
        );

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  } catch {
    // Phản hồi không có JSON hợp lệ
  }

  return `Yêu cầu thất bại (HTTP ${response.status}).`;
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Income");
  const [category, setCategory] = useState("Khác");

  // Người dùng nhập ngày theo định dạng dd/MM/yyyy
  const [date, setDate] = useState(formatDateVN(getLocalDate()));

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [budgetSuccess, setBudgetSuccess] = useState("");
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);
  const [isBudgetSaving, setIsBudgetSaving] = useState(false);
  const [activeNav, setActiveNav] = useState<string>("overview");

  useEffect(() => {
    const sectionIds = ["overview", "budget", "savings-goals", "transactions"];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY - 140;
          const bottom = top + el.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            setActiveNav(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavigate(targetId: string) {
    setActiveNav(targetId);
    if (targetId === "budget" && selectedMonth === "all") {
      setSelectedMonth(getCurrentMonth());
      setTimeout(() => {
        const el = document.getElementById("budget");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function loadTransactions(): Promise<boolean> {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const data: Transaction[] = await response.json();

      data.sort((a, b) => {
        const difference =
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime();

        return difference || b.id - a.id;
      });

      setTransactions(data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? `Không tải được giao dịch: ${err.message}`
          : "Không kết nối được API. Hãy kiểm tra backend và CORS."
      );

      return false;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  async function loadBudget(month: string): Promise<boolean> {
    if (month === "all") {
      setBudget(null);
      setBudgetAmount("");
      return true;
    }

    const [year, monthNumber] = month.split("-");
    setIsBudgetLoading(true);
    setBudgetError("");

    try {
      const response = await fetch(
        `${BUDGET_API}/${Number(year)}/${Number(monthNumber)}`
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const data: BudgetSummary = await response.json();
      setBudget(data);
      setBudgetAmount(
        data.hasBudget && data.limitAmount !== null
          ? String(data.limitAmount)
          : ""
      );
      return true;
    } catch (err) {
      setBudget(null);
      setBudgetError(
        err instanceof Error
          ? `Không tải được ngân sách: ${err.message}`
          : "Không kết nối được API ngân sách."
      );
      return false;
    } finally {
      setIsBudgetLoading(false);
    }
  }

  useEffect(() => {
    void loadBudget(selectedMonth);
  }, [selectedMonth]);

  const availableMonths = Array.from(
    new Set([
      getCurrentMonth(),
      ...transactions.map((t) => t.transactionDate.slice(0, 7)),
    ])
  ).sort((a, b) => b.localeCompare(a));

  const filteredTransactions =
    selectedMonth === "all"
      ? transactions
      : transactions.filter(
          (t) => t.transactionDate.slice(0, 7) === selectedMonth
        );

  const income = filteredTransactions
    .filter((t) => t.type.toLowerCase() === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = filteredTransactions
    .filter((t) => t.type.toLowerCase() === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expense;

  function startEdit(transaction: Transaction) {
    setEditingId(transaction.id);
    setTitle(transaction.title);
    setAmount(String(transaction.amount));

    setType(
      transaction.type.toLowerCase() === "expense"
        ? "Expense"
        : "Income"
    );
    setCategory(transaction.category || "Khác");

    setDate(formatDateVN(transaction.transactionDate));
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setType("Income");
    setCategory("Khác");
    setDate(formatDateVN(getLocalDate()));
    setError("");
  }

  async function addTransaction(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    const parsedAmount = Number(amount);
    const isoDate = parseDateVN(date);

    if (!trimmedTitle) {
      setError("Cậu hãy nhập tiêu đề giao dịch.");
      return;
    }

    if (trimmedTitle.length > 200) {
      setError("Tiêu đề không được vượt quá 200 ký tự.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Số tiền phải lớn hơn 0.");
      return;
    }

    if (!Number.isInteger(parsedAmount)) {
      setError("Số tiền VND phải là số nguyên.");
      return;
    }

    if (type !== "Income" && type !== "Expense") {
      setError("Loại giao dịch không hợp lệ.");
      return;
    }

    if (!isoDate) {
      setError(
        "Ngày không hợp lệ. Hãy nhập theo dạng dd/MM/yyyy, ví dụ 14/10/2026."
      );
      return;
    }

    const isEditing = editingId !== null;
    setIsSubmitting(true);

    try {
      const response = await fetch(
        isEditing ? `${API}/${editingId}` : API,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            amount: parsedAmount,
            type,
            category,
            transactionDate: `${isoDate}T00:00:00`,
          }),
        }
      );

      if (!response.ok) {
        setError(await getApiError(response));
        return;
      }

      setSelectedMonth(isoDate.slice(0, 7));
      setEditingId(null);
      setTitle("");
      setAmount("");
      setType("Income");
      setCategory("Khác");
      setDate(formatDateVN(getLocalDate()));

      const newMonth = isoDate.slice(0, 7);
      const loaded = await loadTransactions();

      // Chỉ gọi thủ công khi tháng không đổi; nếu tháng đổi, useEffect([selectedMonth]) tự xử lý.
      if (newMonth === selectedMonth) {
        await loadBudget(newMonth);
      }

      if (!loaded) {
        setError(
          "Đã lưu giao dịch nhưng không tải lại được danh sách. Cậu hãy tải lại trang."
        );
      }
    } catch {
      setError("Không kết nối được API. Hãy kiểm tra backend và CORS.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteTransaction(id: number) {
    if (!window.confirm("Cậu có chắc muốn xóa giao dịch này không?")) {
      return;
    }

    setError("");
    setDeletingId(id);

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(await getApiError(response));
        return;
      }

      setTransactions((current) =>
        current.filter((t) => t.id !== id)
      );

      if (selectedMonth !== "all") {
        void loadBudget(selectedMonth);
      }

      if (editingId === id) {
        cancelEdit();
      }
    } catch {
      setError("Không kết nối được API. Không thể xóa giao dịch.");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBudgetError("");
    setBudgetSuccess("");

    if (selectedMonth === "all") {
      setBudgetError("Hãy chọn một tháng cụ thể để thiết lập ngân sách.");
      return;
    }

    const limitAmount = Number(budgetAmount);

    if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
      setBudgetError("Ngân sách phải lớn hơn 0.");
      return;
    }

    if (!Number.isInteger(limitAmount)) {
      setBudgetError("Ngân sách VND phải là số nguyên.");
      return;
    }

    const [year, month] = selectedMonth.split("-");
    setIsBudgetSaving(true);

    try {
      const response = await fetch(
        `${BUDGET_API}/${Number(year)}/${Number(month)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limitAmount }),
        }
      );

      if (!response.ok) {
        setBudgetError(await getApiError(response));
        return;
      }

      const data: BudgetSummary = await response.json();
      setBudget(data);
      setBudgetAmount(String(data.limitAmount ?? limitAmount));
      setBudgetSuccess(
        budget?.hasBudget
          ? "Đã cập nhật ngân sách tháng."
          : "Đã thiết lập ngân sách tháng."
      );
    } catch {
      setBudgetError("Không kết nối được API. Không thể lưu ngân sách.");
    } finally {
      setIsBudgetSaving(false);
    }
  }

  const remainingBudget = budget?.remainingAmount ?? null;
  const budgetUsage = budget?.usagePercentage ?? 0;
  const budgetProgress = Math.min(Math.max(budgetUsage, 0), 100);
  const budgetState =
    budgetUsage >= 100 ? "over" : budgetUsage >= 80 ? "warning" : "safe";

  return (
    <div className="app-layout">
      {/* Sidebar điều hướng chính cho Desktop */}
      <aside className="app-sidebar" aria-label="Thanh điều hướng chính">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <Wallet size={24} />
            </div>
            <div className="brand-text">
              Money<span>Mate</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-section-title">Menu chính</span>
            <ul className="nav-list">
              <li>
                <button
                  type="button"
                  className={`nav-item ${activeNav === "overview" ? "active" : ""}`}
                  onClick={() => handleNavigate("overview")}
                >
                  <LayoutDashboard size={19} />
                  <span>Tổng quan</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-item ${activeNav === "transactions" ? "active" : ""}`}
                  onClick={() => handleNavigate("transactions")}
                >
                  <ReceiptText size={19} />
                  <span>Giao dịch</span>
                  {filteredTransactions.length > 0 && (
                    <span className="nav-badge">{filteredTransactions.length}</span>
                  )}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-item ${activeNav === "budget" ? "active" : ""}`}
                  onClick={() => handleNavigate("budget")}
                >
                  <PiggyBank size={19} />
                  <span>Ngân sách</span>
                  {budget?.hasBudget && budgetState === "over" && (
                    <span className="nav-badge danger">Vượt</span>
                  )}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-item ${activeNav === "savings-goals" ? "active" : ""}`}
                  onClick={() => handleNavigate("savings-goals")}
                >
                  <Target size={19} />
                  <span>Mục tiêu</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-date">
            <CalendarDays size={14} />
            <span>{formatDateVN(getLocalDate())}</span>
          </div>
          <span className="sidebar-tag">Premium Dark Fintech</span>
        </div>
      </aside>

      {/* Nội dung chính của ứng dụng */}
      <div className="app-main-content">
        <header className="topbar">
          <div className="brand">
            <Wallet size={26} />
            Money<span>Mate</span>
          </div>

          <div className="topbar-right">
            <div className="today">
              {formatDateVN(getLocalDate())}
            </div>
          </div>
        </header>

        {/* Thanh điều hướng cố định trên màn hình nhỏ */}
        <nav className="mobile-nav-bar" aria-label="Điều hướng nhanh màn hình nhỏ">
          <button
            type="button"
            className={`mobile-nav-item ${activeNav === "overview" ? "active" : ""}`}
            onClick={() => handleNavigate("overview")}
          >
            <LayoutDashboard size={17} />
            <span>Tổng quan</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${activeNav === "transactions" ? "active" : ""}`}
            onClick={() => handleNavigate("transactions")}
          >
            <ReceiptText size={17} />
            <span>Giao dịch</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${activeNav === "budget" ? "active" : ""}`}
            onClick={() => handleNavigate("budget")}
          >
            <PiggyBank size={17} />
            <span>Ngân sách</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${activeNav === "savings-goals" ? "active" : ""}`}
            onClick={() => handleNavigate("savings-goals")}
          >
            <Target size={17} />
            <span>Mục tiêu</span>
          </button>
        </nav>

        <main className="dashboard">
          <section className="main-column">
            <div id="overview" className="section-anchor">
              <div className="dashboard-header">
            <div className="dashboard-title-group">
              <h1>Tổng quan tài chính</h1>
              <p className="subtitle">
                {selectedMonth === "all"
                  ? "Tất cả giao dịch từ trước đến nay"
                  : `Theo dõi thu chi & ngân sách ${formatMonth(selectedMonth)}`}
              </p>
            </div>

            <div className="month-filter-compact">
              <label htmlFor="month-filter" className="sr-only">
                Xem giao dịch theo tháng
              </label>
              <div className="month-select-wrapper">
                <CalendarDays size={18} />
                <select
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => {
                    setBudgetSuccess("");
                    setSelectedMonth(e.target.value);
                  }}
                  aria-label="Chọn tháng xem giao dịch"
                >
                  <option value="all">Tất cả giao dịch</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <div className="summary">
            <article className="summary-card income-card">
              <TrendingUp size={24} />
              <div>
                <p>Tổng thu nhập</p>
                <h2>{money(income)}</h2>
              </div>
            </article>

            <article className="summary-card expense-card">
              <TrendingDown size={24} />
              <div>
                <p>Tổng chi tiêu</p>
                <h2>{money(expense)}</h2>
              </div>
            </article>

            <article className="summary-card balance-card">
              <Wallet size={24} />
              <div>
                <p>Số dư tài khoản</p>
                <h2 className={balance >= 0 ? "green" : "red"}>{money(balance)}</h2>
              </div>
            </article>
          </div>

            <FinanceChart
              transactions={transactions}
              selectedMonth={selectedMonth}
            />
          </div>

          <div id="budget" className="section-anchor">
            {selectedMonth !== "all" ? (
              <section className="panel budget-panel">
                <div className="budget-heading">
                  <div>
                    <h2>
                      <PiggyBank size={22} />
                      Ngân sách tháng
                    </h2>
                    <p className="subtitle">{formatMonth(selectedMonth)}</p>
                  </div>
                </div>

                {budgetError && (
                  <div className="error" role="alert">
                    {budgetError}
                  </div>
                )}

                {budgetSuccess && (
                  <div className="success" role="status">
                    <CircleCheck size={18} />
                    {budgetSuccess}
                  </div>
                )}

                {isBudgetLoading ? (
                  <p className="empty">Đang tải ngân sách...</p>
                ) : (
                  <>
                    <div className="budget-summary">
                      <article>
                        <span>Ngân sách đã đặt</span>
                        <strong>
                          {budget?.hasBudget && budget.limitAmount !== null
                            ? money(budget.limitAmount)
                            : "Chưa thiết lập"}
                        </strong>
                      </article>
                      <article>
                        <span>Chi tiêu thực tế</span>
                        <strong className="red">
                          {money(budget?.actualExpense ?? 0)}
                        </strong>
                      </article>
                      <article>
                        <span>Ngân sách còn lại</span>
                        <strong
                          className={
                            remainingBudget !== null && remainingBudget < 0
                              ? "red"
                              : "green"
                          }
                        >
                          {remainingBudget !== null
                            ? money(remainingBudget)
                            : "—"}
                        </strong>
                      </article>
                    </div>

                    {budget?.hasBudget ? (
                      <div className={`budget-progress ${budgetState}`}>
                        <div className="budget-progress-label">
                          <span>Đã sử dụng</span>
                          <strong>{budgetUsage.toFixed(1)}%</strong>
                        </div>
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label="Tỷ lệ ngân sách đã sử dụng"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={budgetProgress}
                        >
                          <span style={{ width: `${budgetProgress}%` }} />
                        </div>
                        <p className="budget-status">
                          {budgetState === "over" ? (
                            <>
                              <CircleAlert size={18} /> Đã vượt ngân sách tháng.
                            </>
                          ) : budgetState === "warning" ? (
                            <>
                              <CircleAlert size={18} /> Chi tiêu sắp chạm ngân sách.
                            </>
                          ) : (
                            "Chi tiêu hiện vẫn trong mức ngân sách."
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="budget-notice">
                        Tháng này chưa có ngân sách. Hãy nhập số tiền để bắt đầu theo dõi.
                      </p>
                    )}

                    <form className="budget-form" onSubmit={saveBudget}>
                      <label htmlFor="budget-amount">Ngân sách (VND)</label>
                      <div className="budget-input-row">
                        <input
                          id="budget-amount"
                          type="number"
                          min="1"
                          step="1"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          placeholder="Ví dụ: 5000000"
                          required
                        />
                        <button
                          className="submit-button"
                          type="submit"
                          disabled={isBudgetSaving}
                        >
                          {isBudgetSaving
                            ? "Đang lưu..."
                            : budget?.hasBudget
                              ? "Cập nhật"
                              : "Lưu ngân sách"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </section>
            ) : (
              <section className="panel budget-panel budget-empty-month">
                <div className="budget-heading">
                  <div>
                    <h2>
                      <PiggyBank size={22} />
                      Ngân sách tháng
                    </h2>
                    <p className="subtitle">Chế độ xem tất cả giao dịch</p>
                  </div>
                </div>
                <p className="budget-notice">
                  Ngân sách được tính theo từng tháng cụ thể. Hãy chọn một tháng trong bộ lọc để xem hoặc thiết lập ngân sách.
                </p>
                <button
                  type="button"
                  className="budget-month-jump-btn"
                  onClick={() => setSelectedMonth(getCurrentMonth())}
                >
                  <CalendarDays size={16} />
                  Xem ngân sách tháng hiện tại ({formatMonth(getCurrentMonth())})
                </button>
              </section>
            )}
          </div>

          <div id="savings-goals" className="section-anchor">
            <SavingsGoals />
          </div>

          <section className="panel transactions-panel" id="transactions">
            <div className="transactions-header">
              <div className="transactions-header-title">
                <h2>
                  <ReceiptText size={20} />
                  Giao dịch gần đây
                </h2>
                <p className="subtitle">
                  {selectedMonth === "all"
                    ? "Toàn bộ giao dịch thu chi đã ghi nhận"
                    : `Các khoản giao dịch trong ${formatMonth(selectedMonth)}`}
                </p>
              </div>
              <span className="transaction-count">
                {filteredTransactions.length} giao dịch
              </span>
            </div>

            {isLoading ? (
              <p className="empty">Đang tải danh sách giao dịch...</p>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-transaction-state">
                <div className="empty-icon-circle">
                  <ReceiptText size={26} />
                </div>
                <p className="empty-title">Không có giao dịch nào</p>
                <p className="empty-desc">
                  Chưa có khoản thu chi nào trong {formatMonth(selectedMonth)}. Hãy thêm giao dịch đầu tiên từ cột bên phải.
                </p>
              </div>
            ) : (
              <div className="transaction-list">
                {filteredTransactions.map((t) => {
                  const isIncome = t.type.toLowerCase() === "income";
                  const isBeingEdited = editingId === t.id;

                  return (
                    <article
                      className={`transaction ${isBeingEdited ? "is-editing" : ""}`}
                      key={t.id}
                    >
                      <div
                        className={`transaction-icon ${
                          isIncome ? "income" : "expense"
                        }`}
                        aria-hidden="true"
                      >
                        {isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>

                      <div className="transaction-info">
                        <strong title={t.title}>{t.title}</strong>
                        <span className="transaction-meta">
                          {formatDateVN(t.transactionDate)} · {t.category || "Khác"}
                        </span>
                      </div>

                      <span
                        className={`amount ${
                          isIncome ? "income" : "expense"
                        }`}
                        title={money(Number(t.amount))}
                      >
                        {isIncome ? "+" : "-"}
                        {money(Number(t.amount))}
                      </span>

                      <div className="transaction-actions">
                        <button
                          className={`icon-button ${isBeingEdited ? "active-edit" : ""}`}
                          type="button"
                          title={`Sửa giao dịch ${t.title}`}
                          aria-label={`Sửa giao dịch ${t.title}`}
                          disabled={deletingId === t.id || isSubmitting}
                          onClick={() => startEdit(t)}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          className="icon-button danger-button"
                          type="button"
                          title={`Xóa giao dịch ${t.title}`}
                          aria-label={`Xóa giao dịch ${t.title}`}
                          disabled={deletingId === t.id || isSubmitting}
                          onClick={() => void deleteTransaction(t.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <aside className="side-column">
          <section className={`panel transaction-form-panel ${editingId !== null ? "is-editing-mode" : ""}`}>
            <div className="form-header">
              <div className="form-header-title-row">
                <h2>
                  {editingId !== null ? (
                    <Pencil size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                  {editingId !== null ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
                </h2>
                {editingId !== null && (
                  <span className="edit-badge">Đang sửa</span>
                )}
              </div>
              <p className="subtitle">
                {editingId !== null
                  ? "Cập nhật các thông tin giao dịch đã chọn"
                  : "Ghi lại khoản thu nhập hoặc chi tiêu mới"}
              </p>
            </div>

            <form onSubmit={addTransaction}>
              <div className="form-group">
                <label htmlFor="transaction-title">Tiêu đề giao dịch *</label>
                <input
                  id="transaction-title"
                  type="text"
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Lương tháng, Đi siêu thị..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transaction-amount">Số tiền (VND) *</label>
                  <input
                    id="transaction-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ví dụ: 500000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-type">Loại giao dịch *</label>
                  <select
                    id="transaction-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Income">Thu nhập (+)</option>
                    <option value="Expense">Chi tiêu (-)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transaction-category">Danh mục *</label>
                  <select
                    id="transaction-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Ăn uống">Ăn uống</option>
                    <option value="Đi lại">Đi lại</option>
                    <option value="Hóa đơn">Hóa đơn</option>
                    <option value="Mua sắm">Mua sắm</option>
                    <option value="Giải trí">Giải trí</option>
                    <option value="Sức khỏe">Sức khỏe</option>
                    <option value="Giáo dục">Giáo dục</option>
                    <option value="Lương">Lương</option>
                    <option value="Thưởng">Thưởng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-date">Ngày (dd/MM/yyyy) *</label>
                  <input
                    id="transaction-date"
                    type="text"
                    inputMode="numeric"
                    placeholder="14/10/2026"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {editingId !== null ? <Pencil size={18} /> : <Plus size={18} />}
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingId !== null
                      ? "Lưu thay đổi"
                      : "Thêm giao dịch"}
                </button>

                {editingId !== null && (
                  <button
                    className="icon-button cancel-edit-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={cancelEdit}
                  >
                    <X size={16} />
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </form>
          </section>
        </aside>
      </main>
      </div>
    </div>
  );
}

export default App;
