const rawArgs = {
  startDate,
  endDate
};

const normalizedStartDate =
  startDate ||
  rawArgs.periodo === "ultimos_7_dias" ||
  rawArgs.period === "last_7_days"
    ? "7daysAgo"
    : "30daysAgo";

const normalizedEndDate = endDate || "today";

const response = await fetch(N8N_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    startDate: normalizedStartDate,
    endDate: normalizedEndDate
  })
});
