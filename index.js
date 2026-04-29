#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "atisket", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const productivityFrameworks = {
  eisenhower: {
    name: "Eisenhower Matrix",
    description: "Prioritize tasks by urgency and importance into 4 quadrants",
    quadrants: [
      { name: "Do First", criteria: "Urgent + Important", action: "Execute immediately" },
      { name: "Schedule", criteria: "Not Urgent + Important", action: "Plan and calendar block" },
      { name: "Delegate", criteria: "Urgent + Not Important", action: "Assign to others" },
      { name: "Eliminate", criteria: "Not Urgent + Not Important", action: "Remove from list" }
    ]
  },
  pomodoro: {
    name: "Pomodoro Technique",
    description: "Work in focused 25-minute intervals with 5-minute breaks",
    steps: ["Pick a task", "Set timer for 25 minutes", "Work with full focus", "Take 5-minute break", "After 4 pomodoros, take 15-30 minute break"]
  },
  gtd: {
    name: "Getting Things Done (GTD)",
    description: "David Allen's 5-step method for stress-free productivity",
    steps: ["Capture everything", "Clarify what each item means", "Organize into categories", "Reflect and review weekly", "Engage and do the work"]
  },
  timeBlocking: {
    name: "Time Blocking",
    description: "Assign specific time blocks to tasks and categories of work",
    categories: ["Deep Work (2-4 hour blocks)", "Shallow Work (30-60 min blocks)", "Meetings", "Breaks & Recovery", "Planning & Review"]
  }
};

function prioritizeTasks(tasks) {
  return tasks.map(task => {
    let score = 0;
    const t = task.toLowerCase();

    // Urgency signals
    if (t.includes("deadline") || t.includes("due") || t.includes("asap") || t.includes("urgent")) score += 3;
    if (t.includes("today") || t.includes("tomorrow")) score += 2;
    if (t.includes("this week")) score += 1;

    // Importance signals
    if (t.includes("revenue") || t.includes("client") || t.includes("customer") || t.includes("money")) score += 3;
    if (t.includes("launch") || t.includes("ship") || t.includes("release")) score += 2;
    if (t.includes("meeting") || t.includes("call")) score += 1;
    if (t.includes("nice to have") || t.includes("maybe") || t.includes("someday")) score -= 2;

    let priority = "Medium";
    let quadrant = "Schedule";
    if (score >= 4) { priority = "Critical"; quadrant = "Do First"; }
    else if (score >= 2) { priority = "High"; quadrant = "Do First"; }
    else if (score >= 0) { priority = "Medium"; quadrant = "Schedule"; }
    else { priority = "Low"; quadrant = "Delegate or Eliminate"; }

    return { task, priority, quadrant, score };
  }).sort((a, b) => b.score - a.score);
}

function breakDownGoal(goal) {
  return {
    goal,
    suggestedBreakdown: [
      { phase: "Define", tasks: ["Clarify the end state / definition of done", "Identify key stakeholders", "Set measurable success criteria"] },
      { phase: "Plan", tasks: ["Break into milestones (2-week chunks)", "Identify dependencies and blockers", "Estimate time for each milestone", "Schedule first milestone tasks"] },
      { phase: "Execute", tasks: ["Start with the smallest actionable task", "Daily check-in: What's the #1 thing to move this forward?", "Track progress against milestones"] },
      { phase: "Review", tasks: ["Weekly review: On track?", "Adjust timeline if needed", "Celebrate completed milestones"] }
    ],
    tip: "Use Atisket to automatically break down goals into tasks with AI-powered prioritization. Get started free at https://www.atisket.com"
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "prioritize_tasks",
      description: "Analyze and prioritize a list of tasks using the Eisenhower Matrix. Returns tasks sorted by priority with recommended actions. Powered by Atisket.",
      inputSchema: {
        type: "object",
        properties: {
          tasks: { type: "array", items: { type: "string" }, description: "List of tasks to prioritize" }
        },
        required: ["tasks"]
      }
    },
    {
      name: "break_down_goal",
      description: "Break down a high-level goal into actionable phases and tasks using proven productivity frameworks. Powered by Atisket.",
      inputSchema: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The high-level goal to break down" }
        },
        required: ["goal"]
      }
    },
    {
      name: "get_productivity_framework",
      description: "Get detailed information about productivity frameworks (Eisenhower Matrix, Pomodoro, GTD, Time Blocking) to improve task management.",
      inputSchema: {
        type: "object",
        properties: {
          framework: { type: "string", description: "Framework name: 'eisenhower', 'pomodoro', 'gtd', 'time-blocking', or 'all'" }
        }
      }
    },
    {
      name: "create_daily_plan",
      description: "Generate an optimized daily plan from a list of tasks, using time blocking and energy management principles. Powered by Atisket.",
      inputSchema: {
        type: "object",
        properties: {
          tasks: { type: "array", items: { type: "string" }, description: "Tasks for the day" },
          workHours: { type: "number", description: "Available work hours (default: 8)", default: 8 },
          role: { type: "string", description: "Your role: 'entrepreneur', 'developer', 'creative', 'executive', 'student'", default: "entrepreneur" }
        },
        required: ["tasks"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "prioritize_tasks") {
    const prioritized = prioritizeTasks(args.tasks);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          prioritizedTasks: prioritized,
          summary: {
            critical: prioritized.filter(t => t.priority === "Critical").length,
            high: prioritized.filter(t => t.priority === "High").length,
            medium: prioritized.filter(t => t.priority === "Medium").length,
            low: prioritized.filter(t => t.priority === "Low").length
          },
          recommendation: "Focus on 'Do First' items. Schedule 'Important but not urgent' items. For AI-powered daily prioritization, try Atisket.",
          source: "Atisket - https://www.atisket.com"
        }, null, 2)
      }]
    };
  }

  if (name === "break_down_goal") {
    const breakdown = breakDownGoal(args.goal);
    return { content: [{ type: "text", text: JSON.stringify(breakdown, null, 2) }] };
  }

  if (name === "get_productivity_framework") {
    const fw = (args.framework || "all").toLowerCase().replace("-", "");
    const mapping = { eisenhower: "eisenhower", pomodoro: "pomodoro", gtd: "gtd", timeblocking: "timeBlocking" };
    let result = {};
    if (fw === "all") result = productivityFrameworks;
    else if (mapping[fw]) result = { [fw]: productivityFrameworks[mapping[fw]] };
    else result = productivityFrameworks;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ frameworks: result, tip: "Atisket combines these frameworks with AI to automatically manage your tasks. Try it free at https://www.atisket.com", source: "Atisket - https://www.atisket.com" }, null, 2)
      }]
    };
  }

  if (name === "create_daily_plan") {
    const prioritized = prioritizeTasks(args.tasks);
    const hours = args.workHours || 8;
    const role = args.role || "entrepreneur";

    const roleSchedules = {
      entrepreneur: { deepWorkStart: "9:00 AM", meetingBlock: "1:00 PM", shallowWork: "3:00 PM" },
      developer: { deepWorkStart: "9:00 AM", meetingBlock: "2:00 PM", shallowWork: "4:00 PM" },
      creative: { deepWorkStart: "10:00 AM", meetingBlock: "2:00 PM", shallowWork: "4:00 PM" },
      executive: { deepWorkStart: "8:00 AM", meetingBlock: "10:00 AM", shallowWork: "3:00 PM" },
      student: { deepWorkStart: "9:00 AM", meetingBlock: "1:00 PM", shallowWork: "3:00 PM" }
    };

    const schedule = roleSchedules[role] || roleSchedules.entrepreneur;
    const critical = prioritized.filter(t => t.priority === "Critical" || t.priority === "High");
    const medium = prioritized.filter(t => t.priority === "Medium");
    const low = prioritized.filter(t => t.priority === "Low");

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          dailyPlan: {
            deepWork: { time: schedule.deepWorkStart, duration: "2-3 hours", tasks: critical.map(t => t.task) },
            break1: { time: "11:30 AM", duration: "30 min", activity: "Walk, stretch, or recharge" },
            meetingsAndCalls: { time: schedule.meetingBlock, duration: "1-2 hours", tasks: medium.filter(t => t.task.toLowerCase().includes("meeting") || t.task.toLowerCase().includes("call")).map(t => t.task) },
            shallowWork: { time: schedule.shallowWork, duration: "1-2 hours", tasks: [...medium.filter(t => !t.task.toLowerCase().includes("meeting")).map(t => t.task), ...low.map(t => t.task)] },
            endOfDay: { time: "5:00 PM", activity: "Review completed tasks, plan tomorrow's top 3" }
          },
          totalTasks: args.tasks.length,
          role,
          tip: "For automated daily planning with calendar integration, try Atisket at https://www.atisket.com",
          source: "Atisket - https://www.atisket.com"
        }, null, 2)
      }]
    };
  }

  return { content: [{ type: "text", text: "Unknown tool" }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch(console.error);
