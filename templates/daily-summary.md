---
id: "daily-plan"
title: "Daily Plan Overview"
category: "Planning"
description: "Morning snapshot of your day from tasks, calendar, and communications"
tags: ["daily", "plan", "overview", "schedule", "productivity"]
author: "system"
version: "1.0"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
favorite: true
variables:
  date:
    type: "date"
    default: "today"
    description: "Date for the plan overview"
    required: true
  priority_focus:
    type: "select"
    default: "high"
    description: "Priority focus for tasks"
    options: ["high", "medium", "all"]
---
****
# Daily Plan for {{date}}

### ✅ Tasks To Focus On (Tasks due today or before which are not completed)
_Pulled using tasks tool for today_
- Task - Due date

### 📅 Scheduled Events
_Pulled from google calendar tool_
- Agenda
    - Time
    - Participants

### 📧 Important Communications
_Pulled from gmail tool_
- Sender - Subject
    - Summary of body


### 🕑 Time Breakdown (Auto-Calculated)
- **Total Meeting Hours**: 
- **Focus Work Slots Available**: 
- **Gaps for Breaks/Other Work**: 

### 🔵 Quick Summary of Day
- Earliest Start: 
- Latest Meeting Ends: 
- Major Blockers or Context Switching: 

### ⚠️ Risks to Watch Out For
- Meeting overload? Y/N
- Back-to-back calls? Y/N
- Long task with no clear slot? Y/N
