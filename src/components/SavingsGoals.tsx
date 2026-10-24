import { useEffect, useState } from "react";
import { Pencil, Plus, Target, Trash2, X, CheckCircle2 } from "lucide-react";

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

const API = "/api/savingsgoals";
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

      setSuccess(editingId ? "Đã cập nhật mục tiêu thành công." : "Đã tạo mục tiêu mới thành công.");
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
      setSuccess("Đã xóa mục tiêu tiết kiệm.");
    } catch {
      setError("Không kết nối được API. Không thể xóa mục tiêu.");
    }
  }

  return (
    <section className="panel savings-goals-panel">
      <div className="panel-header-row">
        <h2>
          <Target size={20} />
          Mục tiêu tiết kiệm
        </h2>
        {goals.length > 0 && (
          <span className="goal-count-badge">
            {goals.filter((g) => g.savedAmount >= g.targetAmount).length}/{goals.length} hoàn thành
          </span>
        )}
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <form className={`goal-form ${editingId !== null ? "is-editing-mode" : ""}`} onSubmit={saveGoal}>
        {editingId !== null && (
          <div className="goal-edit-banner">
            <span className="goal-edit-badge">Chế độ sửa</span>
            <span>Đang chỉnh sửa: <strong>{form.name || "mục tiêu"}</strong></span>
            <button type="button" onClick={resetForm} className="cancel-goal-inline-btn">
              <X size={14} /> Hủy
            </button>
          </div>
        )}

        <div className="goal-input-group">
          <label htmlFor="goal-name">Tên mục tiêu *</label>
          <input
            id="goal-name"
            value={form.name}
            maxLength={200}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ví dụ: Mua laptop, Quỹ du lịch..."
            required
          />
        </div>

        <div className="goal-form-grid">
          <div className="goal-input-group">
            <label htmlFor="goal-target">Số tiền mục tiêu (VND) *</label>
            <input
              id="goal-target"
              type="number"
              min="1"
              step="1"
              value={form.targetAmount}
              onChange={(e) =>
                setForm({ ...form, targetAmount: e.target.value })
              }
              placeholder="Ví dụ: 30000000"
              required
            />
          </div>

          <div className="goal-input-group">
            <label htmlFor="goal-saved">Đã tiết kiệm được (VND)</label>
            <input
              id="goal-saved"
              type="number"
              min="0"
              step="1"
              value={form.savedAmount}
              onChange={(e) =>
                setForm({ ...form, savedAmount: e.target.value })
              }
              placeholder="Ví dụ: 5000000"
              required
            />
          </div>
        </div>

        <div className="goal-input-group">
          <label htmlFor="goal-date" className="goal-date-label">
            Hạn hoàn thành (tùy chọn)
          </label>
          <input
            id="goal-date"
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
        </div>

        <div className="goal-form-actions">
          <button className="submit-button" type="submit" disabled={isSaving}>
            {editingId ? <Pencil size={16} /> : <Plus size={16} />}
            {isSaving
              ? "Đang lưu..."
              : editingId
                ? "Lưu thay đổi"
                : "Tạo mục tiêu mới"}
          </button>
          {editingId && (
            <button
              className="icon-button cancel-goal-button"
              type="button"
              onClick={resetForm}
            >
              <X size={16} /> Hủy chỉnh sửa
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p className="empty">Đang tải danh sách mục tiêu tiết kiệm...</p>
      ) : goals.length === 0 ? (
        <div className="empty-goal-state">
          <div className="empty-icon-circle">
            <Target size={28} />
          </div>
          <p className="empty-title">Chưa có mục tiêu tiết kiệm nào</p>
          <p className="empty-desc">
            Thiết lập mục tiêu mua sắm, quỹ dự phòng hoặc kế hoạch dài hạn bằng biểu mẫu phía trên để bắt đầu theo dõi tiến độ.
          </p>
        </div>
      ) : (
        <div className="goal-list">
          {goals.map((goal) => {
            const percentage =
              goal.targetAmount > 0
                ? (goal.savedAmount / goal.targetAmount) * 100
                : 0;
            const progress = Math.min(Math.max(percentage, 0), 100);
            const remaining = goal.targetAmount - goal.savedAmount;
            const isCompleted = remaining <= 0;

            return (
              <article
                className={`goal-card ${isCompleted ? "is-completed" : ""} ${
                  editingId === goal.id ? "is-editing" : ""
                }`}
                key={goal.id}
              >
                <div className="goal-card-heading">
                  <div className="goal-heading-text">
                    <h3 title={goal.name}>{goal.name}</h3>
                    <p className="goal-date-meta">
                      <span className="goal-date-label-txt">Hạn:</span>{" "}
                      {formatDate(goal.targetDate)}
                    </p>
                  </div>
                  <div className="goal-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => startEdit(goal)}
                      title={`Sửa mục tiêu ${goal.name}`}
                      aria-label={`Sửa mục tiêu ${goal.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button danger-button"
                      type="button"
                      onClick={() => void deleteGoal(goal)}
                      title={`Xóa mục tiêu ${goal.name}`}
                      aria-label={`Xóa mục tiêu ${goal.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="goal-amounts">
                  <div className="goal-amount-item">
                    <span className="goal-amount-label">Đã tiết kiệm</span>
                    <span className="goal-amount-val saved">{money(goal.savedAmount)}</span>
                  </div>
                  <div className="goal-amount-item target">
                    <span className="goal-amount-label">Mục tiêu</span>
                    <strong className="goal-amount-val target">{money(goal.targetAmount)}</strong>
                  </div>
                </div>

                <div
                  className={`progress-track ${isCompleted ? "completed" : ""}`}
                  role="progressbar"
                  aria-label={`Tiến độ ${goal.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <span
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="goal-card-footer">
                  <div className={isCompleted ? "green goal-status" : "goal-remaining goal-status"}>
                    {isCompleted ? (
                      <span className="goal-completed-text">
                        <CheckCircle2 size={15} /> Đã hoàn thành!
                      </span>
                    ) : (
                      <span className="goal-remaining-text">
                        Còn thiếu: <strong>{money(remaining)}</strong>
                      </span>
                    )}
                  </div>
                  <span
                    className={`goal-percentage-badge ${
                      isCompleted ? "completed" : ""
                    }`}
                  >
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
