import { useEffect, useState } from "react";
import { Pencil, Plus, Target, Trash2, X } from "lucide-react";

type SavingsGoal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
};

type GoalForm = {
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string;
};

const API = "http://localhost:5141/api/savingsgoals";
const emptyForm: GoalForm = {
  name: "",
  targetAmount: "",
  savedAmount: "0",
  targetDate: "",
};

function money(value: number): string {
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatDate(date: string | null): string {
  if (!date) {
    return "Chưa đặt hạn";
  }

  const [year, month, day] = date.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
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
        .filter((value): value is string => typeof value === "string");

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  } catch {
    // Phản hồi không có JSON hợp lệ
  }

  return `Yêu cầu thất bại (HTTP ${response.status}).`;
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadGoals() {
    try {
      const response = await fetch(API);
      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      setGoals(await response.json());
    } catch (err) {
      setError(
        err instanceof Error
          ? `Không tải được mục tiêu: ${err.message}`
          : "Không kết nối được API mục tiêu tiết kiệm."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadGoals();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(goal: SavingsGoal) {
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      savedAmount: String(goal.savedAmount),
      targetDate: goal.targetDate?.slice(0, 10) ?? "",
    });
    setEditingId(goal.id);
    setError("");
    setSuccess("");
  }

  async function saveGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetAmount = Number(form.targetAmount);
    const savedAmount = Number(form.savedAmount || 0);

    if (!form.name.trim()) {
      setError("Hãy nhập tên mục tiêu.");
      return;
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError("Số tiền mục tiêu phải lớn hơn 0.");
      return;
    }

    if (!Number.isFinite(savedAmount) || savedAmount < 0) {
      setError("Số tiền đã tiết kiệm không được âm.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          targetAmount,
          savedAmount,
          targetDate: form.targetDate ? `${form.targetDate}T00:00:00` : null,
        }),
      });

      if (!response.ok) {
        setError(await getApiError(response));
        return;
      }

      setSuccess(editingId ? "Đã cập nhật mục tiêu." : "Đã tạo mục tiêu mới.");
      resetForm();
      await loadGoals();
    } catch {
      setError("Không kết nối được API. Không thể lưu mục tiêu.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteGoal(goal: SavingsGoal) {
    if (!window.confirm(`Xóa mục tiêu “${goal.name}”?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${goal.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await getApiError(response));
        return;
      }

      setGoals((current) => current.filter((item) => item.id !== goal.id));
      if (editingId === goal.id) {
        resetForm();
      }
      setSuccess("Đã xóa mục tiêu.");
    } catch {
      setError("Không kết nối được API. Không thể xóa mục tiêu.");
    }
  }

  return (
    <section className="panel savings-goals-panel">
      <h2>
        <Target size={22} />
        Mục tiêu tiết kiệm
      </h2>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <form className="goal-form" onSubmit={saveGoal}>
        <input
          aria-label="Tên mục tiêu"
          value={form.name}
          maxLength={200}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ví dụ: Mua laptop"
          required
        />
        <div className="goal-form-grid">
          <input
            aria-label="Số tiền mục tiêu"
            type="number"
            min="1"
            step="1"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            placeholder="Mục tiêu (VND)"
            required
          />
          <input
            aria-label="Số tiền đã tiết kiệm"
            type="number"
            min="0"
            step="1"
            value={form.savedAmount}
            onChange={(e) => setForm({ ...form, savedAmount: e.target.value })}
            placeholder="Đã tiết kiệm (VND)"
            required
          />
        </div>
        <label className="goal-date-label">
          Hạn hoàn thành (tùy chọn)
          <input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
        </label>
        <div className="goal-form-actions">
          <button className="submit-button" type="submit" disabled={isSaving}>
            {editingId ? <Pencil size={18} /> : <Plus size={18} />}
            {isSaving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mục tiêu"}
          </button>
          {editingId && (
            <button className="icon-button" type="button" onClick={resetForm}>
              <X size={18} /> Hủy
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p className="empty">Đang tải mục tiêu...</p>
      ) : goals.length === 0 ? (
        <p className="empty">Chưa có mục tiêu nào. Hãy tạo mục tiêu đầu tiên.</p>
      ) : (
        <div className="goal-list">
          {goals.map((goal) => {
            const percentage = (goal.savedAmount / goal.targetAmount) * 100;
            const progress = Math.min(Math.max(percentage, 0), 100);
            const remaining = goal.targetAmount - goal.savedAmount;

            return (
              <article className="goal-card" key={goal.id}>
                <div className="goal-card-heading">
                  <div>
                    <h3>{goal.name}</h3>
                    <p>Hạn: {formatDate(goal.targetDate)}</p>
                  </div>
                  <div className="goal-actions">
                    <button className="icon-button" type="button" onClick={() => startEdit(goal)} aria-label={`Sửa ${goal.name}`}>
                      <Pencil size={17} />
                    </button>
                    <button className="icon-button danger-button" type="button" onClick={() => void deleteGoal(goal)} aria-label={`Xóa ${goal.name}`}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className="goal-amounts">
                  <span>{money(goal.savedAmount)} đã tiết kiệm</span>
                  <strong>{money(goal.targetAmount)}</strong>
                </div>
                <div className="progress-track" role="progressbar" aria-label={`Tiến độ ${goal.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <p className={remaining <= 0 ? "green" : "goal-remaining"}>
                  {remaining <= 0 ? "Đã hoàn thành mục tiêu!" : `Còn ${money(remaining)}`}
                  {` · ${percentage.toFixed(1)}%`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
