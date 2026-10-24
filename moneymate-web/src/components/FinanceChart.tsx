
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
  transactionDate: string;
};

type Props = {
  transactions: Transaction[];
  selectedMonth: string;
};

type ChartItem = {
  month: string;
  day: string;
  income: number;
  expense: number;
};

type CategoryItem = {
  name: string;
  value: number;
};

const CATEGORY_COLORS = [
  "#16a34a",
  "#2563eb",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#0f766e",
  "#ea580c",
  "#64748b",
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `Tháng ${Number(monthNumber)}/${year}`;
}

function formatMoney(value: number): string {
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function shortMonth(month: string): string {
  return `T${Number(month.split("-")[1])}`;
}

export default function FinanceChart({
  transactions,
  selectedMonth,
}: Props) {
  const [mode, setMode] = useState<"day" | "month">("day");

  const monthlyData = useMemo<ChartItem[]>(() => {
    const totals = new Map<string, ChartItem>();

    transactions.forEach((transaction) => {
      const month = transaction.transactionDate.slice(0, 7);

      if (!totals.has(month)) {
        totals.set(month, {
          month,
          day: "",
          income: 0,
          expense: 0,
        });
      }

      const item = totals.get(month)!;
      const amount = Number(transaction.amount);

      if (transaction.type.toLowerCase() === "income") {
        item.income += amount;
      } else if (transaction.type.toLowerCase() === "expense") {
        item.expense += amount;
      }
    });

    return Array.from(totals.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [transactions]);

  const dailyData = useMemo<ChartItem[]>(() => {
    const month =
      selectedMonth === "all" ? getCurrentMonth() : selectedMonth;

    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const day = String(dayNumber).padStart(2, "0");
      const dateKey = `${month}-${day}`;

      const dayTransactions = transactions.filter(
        (transaction) =>
          transaction.transactionDate.slice(0, 10) === dateKey
      );

      return {
        month: "",
        day: String(dayNumber),
        income: dayTransactions
          .filter((t) => t.type.toLowerCase() === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0),
        expense: dayTransactions
          .filter((t) => t.type.toLowerCase() === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });
  }, [transactions, selectedMonth]);

  const categoryData = useMemo<CategoryItem[]>(() => {
    const totals = new Map<string, number>();

    transactions
      .filter(
        (transaction) =>
          transaction.type.toLowerCase() === "expense" &&
          (selectedMonth === "all" ||
            transaction.transactionDate.slice(0, 7) === selectedMonth)
      )
      .forEach((transaction) => {
        const category = transaction.category || "Khác";
        totals.set(category, (totals.get(category) ?? 0) + Number(transaction.amount));
      });

    return Array.from(totals, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [transactions, selectedMonth]);

  const showDailyPrompt = mode === "day" && selectedMonth === "all";
  const chartData = mode === "month" ? monthlyData : dailyData;

  return (
    <section className="panel chart-panel">
      <h2>
        <BarChart3 size={22} />
        Thống kê thu chi
      </h2>

      <div className="chart-mode-switch">
        <button
          type="button"
          className={mode === "day" ? "active" : ""}
          aria-pressed={mode === "day"}
          onClick={() => setMode("day")}
        >
          Theo ngày
        </button>

        <button
          type="button"
          className={mode === "month" ? "active" : ""}
          aria-pressed={mode === "month"}
          onClick={() => setMode("month")}
        >
          Theo tháng
        </button>
      </div>

      <p className="subtitle">
        {mode === "day"
          ? selectedMonth === "all"
            ? "Chọn một tháng ở bộ lọc phía trên để xem biểu đồ theo ngày."
            : `Thu nhập và chi tiêu từng ngày — ${formatMonth(selectedMonth)}`
          : "So sánh thu nhập và chi tiêu theo tháng."}
      </p>

      {showDailyPrompt ? (
        <p className="empty">
          Chọn một tháng ở bộ lọc phía trên để xem biểu đồ theo ngày.
        </p>
      ) : chartData.length === 0 ? (
        <p className="empty">Chưa có dữ liệu để hiển thị biểu đồ.</p>
      ) : (
        <div className="finance-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 12, left: 12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey={mode === "month" ? "month" : "day"}
                tickFormatter={(value: string) =>
                  mode === "month" ? shortMonth(value) : value
                }
                interval={mode === "day" ? 3 : 0}
              />

              <YAxis
                width={75}
                tickFormatter={(value: number) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toLocaleString("vi-VN", {
                        maximumFractionDigits: 1,
                      })}tr`
                    : value.toLocaleString("vi-VN")
                }
              />

              <Tooltip
                labelFormatter={(label) => {
                  if (mode === "month") {
                    return formatMonth(String(label));
                  }

                  const month =
                    selectedMonth === "all"
                      ? getCurrentMonth()
                      : selectedMonth;

                  return `Ngày ${label}/${month.slice(5, 7)}/${month.slice(0, 4)}`;
                }}
                formatter={(value) => [formatMoney(Number(value))]}
              />

              <Legend />

              <Bar
                dataKey="income"
                name="Thu nhập"
                fill="#16a34a"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="expense"
                name="Chi tiêu"
                fill="#ef4444"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {categoryData.length > 0 && (
        <div className="category-chart-section">
          <h3>Chi tiêu theo danh mục</h3>
          <div className="category-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={92}
                  label={({ name, percent }) =>
                    `${name} ${(Number(percent) * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
