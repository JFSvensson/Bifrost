---
name: Generate PR From SOLID Plan
description: "Generate a high-quality pull request description from a Modern Web SOLID Planner output. Triggers: PR description from plan, summarize phase for PR, write PR body from architecture plan."
argument-hint: "Paste planner output and target phase; get a ready-to-use PR title and body."
agent: "ask"
---
Generate a pull request description from the provided planner output.

Inputs you must use:
- Planner output sections: Objective, Current Risks, Proposed Architecture, Phased Plan, First PR Scope, Validation Checklist, Open Questions
- Target phase or PR slice requested by the user

Requirements:
- Keep scope limited to the requested phase/slice
- Make assumptions explicit and list unresolved questions
- Convert architecture intent into reviewer-friendly change rationale
- Highlight risk mitigation and rollback considerations
- Keep language concrete and verifiable

Output exactly this format:

Title:
<concise PR title>

Summary:
- <1-3 bullets>

Why:
- <problem and impact>

What Changed:
- <key code and architecture changes>

Validation:
- <checks run or planned>

Risks and Rollback:
- <known risks and rollback plan>

Follow-ups:
- <next phase items, out of scope>

Linked Plan Context:
- Objective: <short>
- Phase: <short>
- Acceptance Criteria: <short>
