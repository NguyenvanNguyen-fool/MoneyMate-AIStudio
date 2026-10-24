import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "Income" | "Expense";
  category: string;
  transactionDate: string;
  createdAt: string;
}

interface MonthlyBudget {
  id: number;
  budgetMonth: string; // YYYY-MM-01
  limitAmount: number;
  createdAt: string;
}

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  createdAt: string;
}

const ALLOWED_CATEGORIES = new Set([
  "Ăn uống",
  "Đi lại",
  "Hóa đơn",
  "Mua sắm",
  "Giải trí",
  "Sức khỏe",
  "Giáo dục",
  "Lương",
  "Thưởng",
  "Khác",
]);

// Initial seed data
let nextTransactionId = 11;
let nextBudgetId = 2;
let nextGoalId = 4;

const transactions: Transaction[] = [
  {
    id: 1,
    title: "Lương tháng 10",
    amount: 28000000,
    type: "Income",
    category: "Lương",
    transactionDate: "2026-10-05",
    createdAt: "2026-10-05T08:00:00.000Z",
  },
  {
    id: 2,
    title: "Thưởng dự án quý 3",
    amount: 6500000,
    type: "Income",
    category: "Thưởng",
    transactionDate: "2026-10-10",
    createdAt: "2026-10-10T10:00:00.000Z",
  },
  {
    id: 3,
    title: "Tiền thuê nhà và dịch vụ",
    amount: 5500000,
    type: "Expense",
    category: "Hóa đơn",
    transactionDate: "2026-10-06",
    createdAt: "2026-10-06T09:00:00.000Z",
  },
  {
    id: 4,
    title: "Đi siêu thị VinMart",
    amount: 1450000,
    type: "Expense",
    category: "Ăn uống",
    transactionDate: "2026-10-08",
    createdAt: "2026-10-08T18:30:00.000Z",
  },
  {
    id: 5,
    title: "Ăn tối cùng bạn bè",
    amount: 680000,
    type: "Expense",
    category: "Ăn uống",
    transactionDate: "2026-10-12",
    createdAt: "2026-10-12T20:00:00.000Z",
  },
  {
    id: 6,
    title: "Đổ xăng xe máy",
    amount: 150000,
    type: "Expense",
    category: "Đi lại",
    transactionDate: "2026-10-14",
    createdAt: "2026-10-14T07:30:00.000Z",
  },
  {
    id: 7,
    title: "Mua sách chuyên ngành",
    amount: 420000,
    type: "Expense",
    category: "Giáo dục",
    transactionDate: "2026-10-16",
    createdAt: "2026-10-16T14:15:00.000Z",
  },
  {
    id: 8,
    title: "Khám sức khỏe tổng quát",
    amount: 1200000,
    type: "Expense",
    category: "Sức khỏe",
    transactionDate: "2026-10-18",
    createdAt: "2026-10-18T10:00:00.000Z",
  },
  {
    id: 9,
    title: "Mua sắm đồ dùng gia đình",
    amount: 1100000,
    type: "Expense",
    category: "Mua sắm",
    transactionDate: "2026-10-20",
    createdAt: "2026-10-20T16:00:00.000Z",
  },
  {
    id: 10,
    title: "Xem phim & cafe cuối tuần",
    amount: 350000,
    type: "Expense",
    category: "Giải trí",
    transactionDate: "2026-10-22",
    createdAt: "2026-10-22T21:00:00.000Z",
  },
];

const budgets: MonthlyBudget[] = [
  {
    id: 1,
    budgetMonth: "2026-10-01",
    limitAmount: 16000000,
    createdAt: "2026-10-01T00:00:00.000Z",
  },
];

const savingsGoals: SavingsGoal[] = [
  {
    id: 1,
    name: "Quỹ dự phòng khẩn cấp",
    targetAmount: 60000000,
    savedAmount: 38000000,
    targetDate: "2026-12-31",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Nâng cấp Laptop M3 Pro",
    targetAmount: 35000000,
    savedAmount: 25000000,
    targetDate: "2026-11-30",
    createdAt: "2026-09-15T00:00:00.000Z",
  },
  {
    id: 3,
    name: "Du lịch Phú Quốc",
    targetAmount: 15000000,
    savedAmount: 9000000,
    targetDate: "2027-01-20",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
];

function validateTransaction(t: Partial<Transaction>): string | null {
  if (!t.title || !t.title.trim()) {
    return "Tiêu đề không được để trống.";
  }
  if (t.title.trim().length > 200) {
    return "Tiêu đề không được vượt quá 200 ký tự.";
  }
  if (t.amount == null || t.amount <= 0 || isNaN(Number(t.amount))) {
    return "Số tiền phải lớn hơn 0.";
  }
  const typeNormalized = (t.type || "").trim().toLowerCase();
  if (typeNormalized !== "income" && typeNormalized !== "expense") {
    return "Loại giao dịch chỉ được là Income hoặc Expense.";
  }
  if (!t.category || !ALLOWED_CATEGORIES.has(t.category.trim())) {
    return "Danh mục giao dịch không hợp lệ.";
  }
  if (!t.transactionDate || isNaN(Date.parse(t.transactionDate))) {
    return "Ngày giao dịch không hợp lệ.";
  }
  return null;
}

function getBudgetMonthDate(year: number, month: number): string | null {
  if (year < 1 || year > 9999 || month < 1 || month > 12) {
    return null;
  }
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-01`;
}

function calculateBudgetSummary(budgetMonthStr: string) {
  const [yearStr, monthStr] = budgetMonthStr.split("-");

  const budget = budgets.find((b) => b.budgetMonth.startsWith(`${yearStr}-${monthStr}`));

  const monthPrefix = `${yearStr}-${monthStr}`;
  const actualExpense = transactions
    .filter(
      (t) =>
        t.type === "Expense" &&
        t.transactionDate.startsWith(monthPrefix)
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (!budget) {
    return {
      hasBudget: false,
      budgetMonth: `${budgetMonthStr}T00:00:00`,
      limitAmount: null,
      actualExpense,
      remainingAmount: null,
      usagePercentage: null,
    };
  }

  const remainingAmount = budget.limitAmount - actualExpense;
  const usagePercentage = (actualExpense / budget.limitAmount) * 100;

  return {
    hasBudget: true,
    budgetMonth: `${budgetMonthStr}T00:00:00`,
    limitAmount: budget.limitAmount,
    actualExpense,
    remainingAmount,
    usagePercentage,
  };
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // -------------------------------------------------------------
  // Transactions API
  // -------------------------------------------------------------
  app.get("/api/transactions", (_req, res) => {
    const sorted = [...transactions].sort((a, b) => {
      const diff = new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      return diff !== 0 ? diff : b.id - a.id;
    });
    res.json(sorted);
  });

  app.get("/api/transactions/:id", (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }
    const item = transactions.find((t) => t.id === id);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }
    res.json(item);
  });

  app.post("/api/transactions", (req, res) => {
    const error = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const typeNormalized: "Income" | "Expense" =
      req.body.type.trim().toLowerCase() === "income" ? "Income" : "Expense";

    const newTransaction: Transaction = {
      id: nextTransactionId++,
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      type: typeNormalized,
      category: req.body.category.trim(),
      transactionDate: req.body.transactionDate.slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
  });

  app.put("/api/transactions/:id", (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }
    const error = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const item = transactions.find((t) => t.id === id);
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    const typeNormalized: "Income" | "Expense" =
      req.body.type.trim().toLowerCase() === "income" ? "Income" : "Expense";

    item.title = req.body.title.trim();
    item.amount = Number(req.body.amount);
    item.type = typeNormalized;
    item.category = req.body.category.trim();
    item.transactionDate = req.body.transactionDate.slice(0, 10);

    res.json(item);
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }
    transactions.splice(index, 1);
    res.json({ message: "Xóa giao dịch thành công." });
  });

  // -------------------------------------------------------------
  // Budgets API
  // -------------------------------------------------------------
  app.get("/api/budgets/:year/:month", (req, res) => {
    const year = parseInt(String(req.params.year), 10);
    const month = parseInt(String(req.params.month), 10);
    const budgetMonth = getBudgetMonthDate(year, month);
    if (!budgetMonth) {
      return res.status(400).json({ message: "Tháng hoặc năm không hợp lệ." });
    }
    const summary = calculateBudgetSummary(budgetMonth);
    res.json(summary);
  });

  app.put("/api/budgets/:year/:month", (req, res) => {
    const year = parseInt(String(req.params.year), 10);
    const month = parseInt(String(req.params.month), 10);
    const budgetMonth = getBudgetMonthDate(year, month);
    if (!budgetMonth) {
      return res.status(400).json({ message: "Tháng hoặc năm không hợp lệ." });
    }

    const limitAmount = Number(req.body.limitAmount);
    if (isNaN(limitAmount) || limitAmount <= 0) {
      return res.status(400).json({ message: "Ngân sách phải lớn hơn 0." });
    }

    const existingIndex = budgets.findIndex((b) => b.budgetMonth === budgetMonth);
    if (existingIndex >= 0) {
      budgets[existingIndex].limitAmount = limitAmount;
    } else {
      budgets.push({
        id: nextBudgetId++,
        budgetMonth,
        limitAmount,
        createdAt: new Date().toISOString(),
      });
    }

    const summary = calculateBudgetSummary(budgetMonth);
    res.json(summary);
  });

  // -------------------------------------------------------------
  // Savings Goals API (supports both /api/savingsgoals and /api/savings-goals)
  // -------------------------------------------------------------
  const handleGetGoals = (_req: express.Request, res: express.Response) => {
    const sorted = [...savingsGoals].sort((a, b) => {
      if (a.targetDate && !b.targetDate) return -1;
      if (!a.targetDate && b.targetDate) return 1;
      if (a.targetDate && b.targetDate) {
        const diff = new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        if (diff !== 0) return diff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json(sorted);
  };

  const handleCreateGoal = (req: express.Request, res: express.Response) => {
    const { name, targetAmount, savedAmount, targetDate } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên mục tiêu không được để trống." });
    }
    if (name.trim().length > 200) {
      return res.status(400).json({ message: "Tên mục tiêu không được vượt quá 200 ký tự." });
    }
    const target = Number(targetAmount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ message: "Số tiền mục tiêu phải lớn hơn 0." });
    }
    const saved = Number(savedAmount ?? 0);
    if (isNaN(saved) || saved < 0) {
      return res.status(400).json({ message: "Số tiền đã tiết kiệm không được âm." });
    }

    const newGoal: SavingsGoal = {
      id: nextGoalId++,
      name: name.trim(),
      targetAmount: target,
      savedAmount: saved,
      targetDate: targetDate ? targetDate.slice(0, 10) : null,
      createdAt: new Date().toISOString(),
    };

    savingsGoals.push(newGoal);
    res.status(201).json(newGoal);
  };

  const handleUpdateGoal = (req: express.Request, res: express.Response) => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID mục tiêu không hợp lệ." });
    }
    const { name, targetAmount, savedAmount, targetDate } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên mục tiêu không được để trống." });
    }
    if (name.trim().length > 200) {
      return res.status(400).json({ message: "Tên mục tiêu không được vượt quá 200 ký tự." });
    }
    const target = Number(targetAmount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ message: "Số tiền mục tiêu phải lớn hơn 0." });
    }
    const saved = Number(savedAmount ?? 0);
    if (isNaN(saved) || saved < 0) {
      return res.status(400).json({ message: "Số tiền đã tiết kiệm không được âm." });
    }

    const goal = savingsGoals.find((g) => g.id === id);
    if (!goal) {
      return res.status(404).json({ message: "Không tìm thấy mục tiêu tiết kiệm." });
    }

    goal.name = name.trim();
    goal.targetAmount = target;
    goal.savedAmount = saved;
    goal.targetDate = targetDate ? targetDate.slice(0, 10) : null;

    res.json(goal);
  };

  const handleDeleteGoal = (req: express.Request, res: express.Response) => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID mục tiêu không hợp lệ." });
    }
    const index = savingsGoals.findIndex((g) => g.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Không tìm thấy mục tiêu tiết kiệm." });
    }
    savingsGoals.splice(index, 1);
    res.json({ message: "Đã xóa mục tiêu tiết kiệm." });
  };

  app.get("/api/savingsgoals", handleGetGoals);
  app.get("/api/savings-goals", handleGetGoals);
  app.post("/api/savingsgoals", handleCreateGoal);
  app.post("/api/savings-goals", handleCreateGoal);
  app.put("/api/savingsgoals/:id", handleUpdateGoal);
  app.put("/api/savings-goals/:id", handleUpdateGoal);
  app.delete("/api/savingsgoals/:id", handleDeleteGoal);
  app.delete("/api/savings-goals/:id", handleDeleteGoal);

  // -------------------------------------------------------------
  // Frontend Vite integration / Static serving
  // -------------------------------------------------------------
  const distPath = path.resolve(process.cwd(), "dist");
  if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: 3000,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
