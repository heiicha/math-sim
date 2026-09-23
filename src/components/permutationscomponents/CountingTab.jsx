import SegmentedControl from "../statscomponents/SegmentedControl";

const MAX_TASKS = 6;
const MIN_TASKS = 2;

export const DEFINITIONS = {
  addition:
    "If there are r options for performing a particular task, and the number of ways to carry out the kth option is nₖ, for k = 1, 2, 3, ..., r, then the total number of ways of performing the particular task is equal to the sum of the number of ways for all the r different options: n₁ + n₂ + n₃ + ⋯ + nᵣ. Note: the options to perform the task cannot occur at the same time. (§1.1, Addition Principle)",
  multiplication:
    "If one task can be performed in m ways, and following this, a second task can be performed in n ways (regardless of which way the first task was performed), then the number of ways of performing the two tasks in succession is equal to the product of the number of ways for both tasks: m × n. Note: this extends to two or more tasks performed independently in succession. (§1.2, Multiplication Principle)",
};

function makeTask(label, ways) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label, ways };
}

export const DEFAULT_COUNTING_STATE = {
  mode: "addition",
  tasks: [makeTask("Take a bus", 3), makeTask("Take a taxi", 1)],
};

export function CountingControls({ state, setState }) {
  const { mode, tasks } = state;

  const patchTask = (id, patch) =>
    setState({ ...state, tasks: tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const removeTask = (id) => setState({ ...state, tasks: tasks.filter((t) => t.id !== id) });
  const addTask = () => {
    if (tasks.length >= MAX_TASKS) return;
    setState({ ...state, tasks: [...tasks, makeTask(`Option ${tasks.length + 1}`, 2)] });
  };

  return (
    <>
      <SegmentedControl
        label="Principle"
        value={mode}
        onChange={(mode) => setState({ ...state, mode })}
        options={[
          { value: "addition", label: "Addition — either/or" },
          { value: "multiplication", label: "Multiplication — then" },
        ]}
      />

      <div className="control-group">
        <p className="control-group-title">{mode === "addition" ? "Options" : "Tasks, in succession"}</p>
        {tasks.map((task, i) => (
          <div className="counting-task-row" key={task.id}>
            <input
              type="text"
              className="stat-input counting-task-label"
              value={task.label}
              onChange={(e) => patchTask(task.id, { label: e.target.value })}
              aria-label={`Task ${i + 1} name`}
            />
            <input
              type="number"
              className="stat-input counting-task-ways"
              min="1"
              max="20"
              value={task.ways}
              onChange={(e) => patchTask(task.id, { ways: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              aria-label={`Task ${i + 1} number of ways`}
            />
            {tasks.length > MIN_TASKS && (
              <button
                type="button"
                className="remove-entity-button"
                onClick={() => removeTask(task.id)}
                aria-label={`Remove ${task.label}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {tasks.length < MAX_TASKS && (
          <button type="button" className="add-entity-button" onClick={addTask}>
            + Add {mode === "addition" ? "option" : "task"}
          </button>
        )}
      </div>
    </>
  );
}

export function CountingVisual({ state }) {
  const { mode, tasks } = state;
  const operator = mode === "addition" ? "+" : "×";
  const total =
    mode === "addition" ? tasks.reduce((s, t) => s + t.ways, 0) : tasks.reduce((s, t) => s * t.ways, 1);

  return (
    <div className="counting-visual">
      <div className="counting-visual-row">
        {tasks.map((task, i) => (
          <div className="counting-visual-item" key={task.id}>
            {i > 0 && <span className="counting-operator">{operator}</span>}
            <div className="counting-chip">
              <span className="counting-chip-label">{task.label || `Task ${i + 1}`}</span>
              <span className="counting-chip-ways">{task.ways}</span>
            </div>
          </div>
        ))}
        <span className="counting-operator">=</span>
        <div className="counting-chip is-total">
          <span className="counting-chip-label">Total ways</span>
          <span className="counting-chip-ways">{total}</span>
        </div>
      </div>
      <p className="counting-visual-caption">
        {mode === "addition"
          ? "The options are mutually exclusive — only one is taken, so the ways are summed."
          : "The tasks are performed independently, one after another, so the ways are multiplied."}
      </p>
    </div>
  );
}

export function CountingReadout({ state }) {
  const { mode, tasks } = state;
  const total =
    mode === "addition" ? tasks.reduce((s, t) => s + t.ways, 0) : tasks.reduce((s, t) => s * t.ways, 1);
  const formula = tasks.map((t) => t.ways).join(mode === "addition" ? " + " : " × ");

  return (
    <>
      <p className="readout-def">{DEFINITIONS[mode]}</p>
      <p className="formula">
        {formula} = {total}
      </p>
      <div className="result-row is-highlighted">
        <span>Total number of ways</span>
        <strong>{total}</strong>
      </div>
    </>
  );
}
