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
  "#75E0A7", // Soft Mint Green
  "#60A5FA", // Sky Blue
  "#FBBF24", // Amber
  "#A78BFA", // Violet Purple
  "#F87171", // Coral Rose
  "#2DD4BF", // Teal
  "#FB923C", // Warm Orange
  "#94A3B8", // Slate Muted
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
        totals.set(
          category,
          (totals.get(category) ?? 0) + Number(transaction.amount)
        );
      });

    return Array.from(totals, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [transactions, selectedMonth]);

  const showDailyPrompt = mode === "day" && selectedMonth === "all";
  const chartData = mode === "month" ? monthlyData : dailyData;
  const hasCashflowData = chartData.some((item) => item.income > 0 || item.expense > 0);

  return (
    <section className="panel chart-panel">
      <h2>
        <BarChart3 size={20} />
        Thống kê thu chi
      </h2>

      <div className="chart-mode-switch" role="group" aria-label="Chế độ xem biểu đồ">
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
            ? "Chọn một tháng cụ thể ở bộ lọc để xem chi tiết theo ngày."
            : `Biến động thu nhập và chi tiêu từng ngày — ${formatMonth(selectedMonth)}`
          : "So sánh tổng thu nhập và tổng chi tiêu qua các tháng."}
      </p>

      {showDailyPrompt ? (
        <p className="empty">
          Hãy chọn một tháng cụ thể ở bộ lọc phía trên để xem biểu đồ chi tiết theo từng ngày.
        </p>
      ) : !hasCashflowData ? (
        <p className="empty">Không có giao dịch thu chi trong kỳ này để hiển thị biểu đồ.</p>
      ) : (
        <div className="finance-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 12, left: 12, bottom: 8 }}
            >
              <CartesianGrid stroke="#252932" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey={mode === "month" ? "month" : "day"}
                tickFormatter={(value: string) =>
                  mode === "month" ? shortMonth(value) : value
                }
                tick={{ fill: "#9299A4", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#30343B" }}
                interval={mode === "day" ? 2 : 0}
              />

              <YAxis
                width={70}
                tickFormatter={(value: number) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toLocaleString("vi-VN", {
                        maximumFractionDigits: 1,
                      })} tr`
                    : value.toLocaleString("vi-VN")
                }
                tick={{ fill: "#9299A4", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1B1E24",
                  borderRadius: "8px",
                  border: "1px solid #30343B",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
                  fontSize: "13px",
                  color: "#F4F6F8",
                }}
                itemStyle={{ color: "#F4F6F8" }}
                labelStyle={{ color: "#9299A4", fontWeight: 600, marginBottom: "4px" }}
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

              <Legend
                wrapperStyle={{
                  paddingTop: "12px",
                  fontSize: "13px",
                  color: "#9299A4",
                }}
              />

              <Bar
                dataKey="income"
                name="Thu nhập"
                fill="#75E0A7"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />

              <Bar
                dataKey="expense"
                name="Chi tiêu"
                fill="#F87171"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {categoryData.length > 0 && (
        <div className="category-chart-section">
          <h3>Chi tiêu theo danh mục</h3>
          <p className="subtitle">
            Phân bổ cơ cấu chi tiêu trong {formatMonth(selectedMonth)}
          </p>

          <div className="category-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="#1B1E24"
                  strokeWidth={2}
                >
                  {categoryData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1B1E24",
                    borderRadius: "8px",
                    border: "1px solid #30343B",
                    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
                    fontSize: "13px",
                    color: "#F4F6F8",
                  }}
                  itemStyle={{ color: "#F4F6F8" }}
                  labelStyle={{ color: "#9299A4", fontWeight: 600, marginBottom: "4px" }}
                  formatter={(value, name) => [
                    formatMoney(Number(value)),
                    `${String(name)}`,
                  ]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: "14px",
                    fontSize: "12.5px",
                    color: "#9299A4",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
