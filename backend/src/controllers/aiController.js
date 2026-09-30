const asyncHandler = require("../utils/asyncHandler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Note = require("../models/Note");
const AIConversation = require("../models/AIConversation");
const Event = require("../models/Event");
const Reminder = require("../models/Reminder");
const DailyPlan = require("../models/DailyPlan");
const { generateAIResponse } = require("../services/groqService");
const { executeTool } = require("../services/aiTools");
const { normalizeDateTime, normalizeDateOnly, normalizeToolArgs } = require("../utils/dateTime");

const parseModelJson = (response) => {
  const cleaned = String(response).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("AI returned invalid JSON.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

const contextFor = async (userId) => {
  const [tasks, projects, notes, events, reminders, conversations] = await Promise.all([
    Task.find({ user: userId }).select("title description status priority dueDate").limit(100).lean(),
    Project.find({ user: userId }).select("name description status deadline").limit(50).lean(),
    Note.find({ user: userId }).select("title content tags").limit(50).lean(),
    Event.find({ user: userId, startTime: { $gte: new Date() } }).select("title startTime endTime location").limit(50).lean(),
    Reminder.find({ user: userId, completed: false, remindAt: { $gte: new Date() } }).select("title remindAt").limit(50).lean(),
    AIConversation.find({ user: userId }).sort({ updatedAt: -1 }).select("title messages").limit(5).lean()
  ]);
  return JSON.stringify({ tasks, projects, notes, events, reminders, conversations });
};

const chat = asyncHandler(async (req, res) => {
  const { prompt, messages = [], conversationId } = req.body;
  if (!prompt && !messages.length) return res.status(400).json({ message: "prompt or messages is required." });
  const context = await contextFor(req.user._id);
  const input = messages.length ? messages : [{ role: "user", content: prompt }];
  const response = await generateAIResponse([
    { role: "system", content: `You are FlowPilot, a concise productivity assistant. User data context: ${context}` },
    ...input
  ]);
  if (conversationId) {
    await AIConversation.findOneAndUpdate(
      { _id: conversationId, user: req.user._id },
      { $push: { messages: { $each: [...input, { role: "assistant", content: response }] } } },
      { new: true }
    );
  }
  res.json({ response });
});

const agent = asyncHandler(async (req, res) => {
  const { prompt, conversationId } = req.body;
  if (!prompt) return res.status(400).json({ message: "prompt is required." });
  const response = await generateAIResponse([
    { role: "system", content: `Decide whether a FlowPilot tool should execute. Return JSON only: {\"tool\": string|null, \"args\": object, \"reply\": string}. Available tools: createTask, updateTask, deleteTask, createReminder, createEvent, createProject, createDailyPlan, getTasks. Current time is ${new Date().toISOString()}. Convert natural-language dates such as tomorrow at 10 AM and next Friday at 3 PM into ISO 8601 timestamps in tool args. For events, provide startTime and endTime as ISO timestamps.` },
    { role: "user", content: prompt }
  ]);
  let decision;
  try { decision = parseModelJson(response); } catch { return res.status(502).json({ message: "AI returned invalid agent data." }); }
  decision.args = normalizeToolArgs(decision.tool, decision.args || {});
  const promptDate = normalizeDateTime(prompt);
  if (decision.tool === "createReminder" && promptDate !== prompt) decision.args.remindAt = promptDate;
  if (decision.tool === "createEvent" && /\b(?:today|tomorrow|next\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/i.test(prompt)) {
    const inferredEvent = normalizeToolArgs("createEvent", { startTime: prompt });
    decision.args.startTime = inferredEvent.startTime || decision.args.startTime;
    decision.args.endTime = inferredEvent.endTime || decision.args.endTime;
  }
  let result = null;
  if (decision.tool) result = await executeTool(req.user._id, decision.tool, decision.args);
  if (conversationId) await AIConversation.findOneAndUpdate({ _id: conversationId, user: req.user._id }, { $push: { messages: { $each: [{ role: "user", content: prompt }, { role: "assistant", content: decision.reply }] } } });
  res.json({ reply: decision.reply, tool: decision.tool || null, result });
});

const createTask = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "prompt is required." });
  const response = await generateAIResponse([
    { role: "system", content: "Extract one task from the user's request. Return JSON only: {\"title\": string, \"description\": string, \"priority\": \"low\"|\"medium\"|\"high\", \"dueDate\": string|null}." },
    { role: "user", content: prompt }
  ]);
  let taskData;
  try { taskData = parseModelJson(response); } catch { return res.status(502).json({ message: "AI returned invalid task data." }); }
  taskData = normalizeToolArgs("createTask", taskData);
  const task = await Task.create({ ...taskData, user: req.user._id });
  res.status(201).json({ task });
});

const plan = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "prompt is required." });
  const context = await contextFor(req.user._id);
  const response = await generateAIResponse([
    { role: "system", content: `Create a practical plan from the user's request and context. Return JSON only: {\"title\": string, \"date\": ISO-8601 date string, \"tasks\": [{\"title\": string, \"description\": string, \"scheduledTime\": string, \"priority\": \"low\"|\"medium\"|\"high\"}]}. Use existing tasks and scheduled events/reminders when sequencing work. Context: ${context}` },
    { role: "user", content: prompt }
  ]);
  let planData;
  try { planData = parseModelJson(response); } catch { return res.status(502).json({ message: "AI returned invalid plan data." }); }
  const requestedDate = normalizeDateTime(prompt);
  const date = requestedDate !== prompt ? requestedDate : normalizeDateTime(planData.date) || new Date().toISOString();
  const requestedDatePart = normalizeDateOnly(prompt);
  const planDatePart = /^\d{4}-\d{2}-\d{2}$/.test(requestedDatePart) ? requestedDatePart : normalizeDateOnly(date);
  const tasks = await Promise.all((planData.tasks || []).map((item) => Task.create({
    user: req.user._id,
    title: item.title,
    description: item.description || "",
    priority: item.priority || "medium",
    dueDate: item.scheduledTime ? normalizeDateTime(`${planDatePart} at ${String(item.scheduledTime).match(/(?:T|\s)(\d{1,2}:\d{2}(?::\d{2})?)/)?.[1] || item.scheduledTime}`) : date
  })));
  const dailyPlan = await DailyPlan.create({
    user: req.user._id,
    title: planData.title || "AI Daily Plan",
    date,
    aiGenerated: true,
    tasks: tasks.map((task, index) => ({ taskId: task._id, title: task.title, scheduledTime: planData.tasks[index].scheduledTime, priority: task.priority }))
  });
  res.json({ plan: dailyPlan, tasks });
});

const textOperation = (instruction) => asyncHandler(async (req, res) => {
  const { text, prompt } = req.body;
  if (!text && !prompt) return res.status(400).json({ message: "text or prompt is required." });
  const response = await generateAIResponse([{ role: "system", content: instruction }, { role: "user", content: text || prompt }]);
  res.json({ response });
});

module.exports = {
  chat,
  agent,
  createTask,
  plan,
  prioritize: textOperation("Prioritize the provided tasks and explain the order concisely."),
  summarize: textOperation("Summarize the provided text in concise bullet points."),
  productivity: textOperation("Analyze the provided productivity data and give three actionable recommendations.")
};
