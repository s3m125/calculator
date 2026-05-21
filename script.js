(() => {
  const currentEl = document.getElementById("current");
  const historyEl = document.getElementById("history");

  const state = {
    current: "0",
    previous: null,
    operator: null,
    justEvaluated: false,
  };

  const OP_SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  function format(numStr) {
    if (numStr === "Error") return numStr;
    const [intPart, decPart] = numStr.split(".");
    const sign = intPart.startsWith("-") ? "-" : "";
    const digits = sign ? intPart.slice(1) : intPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart !== undefined
      ? `${sign}${withCommas}.${decPart}`
      : `${sign}${withCommas}`;
  }

  function render() {
    currentEl.textContent = format(state.current);
    if (state.operator && state.previous !== null) {
      historyEl.textContent = `${format(state.previous)} ${OP_SYMBOL[state.operator]}`;
    } else {
      historyEl.textContent = "";
    }
    document.querySelectorAll(".key.op").forEach((btn) => {
      btn.classList.toggle(
        "active",
        state.operator === btn.dataset.op && !state.justEvaluated && state.current === "0"
      );
    });
  }

  function inputNum(n) {
    if (state.current === "Error") clearAll();
    if (state.justEvaluated) {
      state.current = n;
      state.previous = null;
      state.operator = null;
      state.justEvaluated = false;
    } else if (state.current === "0") {
      state.current = n;
    } else if (state.current.length < 15) {
      state.current += n;
    }
    render();
  }

  function inputDot() {
    if (state.current === "Error") clearAll();
    if (state.justEvaluated) {
      state.current = "0.";
      state.previous = null;
      state.operator = null;
      state.justEvaluated = false;
    } else if (!state.current.includes(".")) {
      state.current += ".";
    }
    render();
  }

  function setOperator(op) {
    if (state.current === "Error") return;
    if (state.operator && state.previous !== null && !state.justEvaluated) {
      compute();
    }
    state.previous = state.current;
    state.operator = op;
    state.current = "0";
    state.justEvaluated = false;
    render();
  }

  function compute() {
    if (state.operator === null || state.previous === null) return;
    const a = parseFloat(state.previous);
    const b = parseFloat(state.current);
    let result;
    switch (state.operator) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "*": result = a * b; break;
      case "/":
        if (b === 0) { state.current = "Error"; state.previous = null; state.operator = null; render(); return; }
        result = a / b; break;
    }
    state.current = String(Number.isFinite(result) ? +result.toFixed(10) : "Error");
    state.previous = null;
    state.operator = null;
    state.justEvaluated = true;
    render();
  }

  function clearAll() {
    state.current = "0";
    state.previous = null;
    state.operator = null;
    state.justEvaluated = false;
    render();
  }

  function toggleSign() {
    if (state.current === "Error" || state.current === "0") return;
    state.current = state.current.startsWith("-")
      ? state.current.slice(1)
      : "-" + state.current;
    render();
  }

  function percent() {
    if (state.current === "Error") return;
    state.current = String(parseFloat(state.current) / 100);
    render();
  }

  // Click handlers
  document.querySelectorAll(".key").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { num, action, op } = btn.dataset;
      if (num !== undefined) return inputNum(num);
      if (action === "dot") return inputDot();
      if (action === "op") return setOperator(op);
      if (action === "equals") return compute();
      if (action === "clear") return clearAll();
      if (action === "sign") return toggleSign();
      if (action === "percent") return percent();
    });
  });

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    if (/^[0-9]$/.test(e.key)) return inputNum(e.key);
    if (e.key === ".") return inputDot();
    if (["+", "-", "*", "/"].includes(e.key)) return setOperator(e.key);
    if (e.key === "Enter" || e.key === "=") { e.preventDefault(); return compute(); }
    if (e.key === "Escape") return clearAll();
    if (e.key === "%") return percent();
    if (e.key === "Backspace") {
      if (state.current === "Error" || state.justEvaluated) return clearAll();
      state.current = state.current.length > 1 ? state.current.slice(0, -1) : "0";
      render();
    }
  });

  render();
})();
